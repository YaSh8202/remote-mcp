// Postbuild fix for Mastra on serverless (Vercel).
//
// Several @mastra/* packages depend on other packages via pnpm npm-aliases, e.g.
//   @mastra/core         -> @ai-sdk/provider-utils-v5 (npm:@ai-sdk/provider-utils@3)
//                           @ai-sdk/provider-utils-v6, @ai-sdk/provider-v5/v6
//   @mastra/schema-compat -> zod-from-json-schema-v3 (npm:zod-from-json-schema)
//
// Nitro's server bundle flattens node_modules by REAL package name, so these
// alias directories never exist in the output and the deployed function crashes
// with `ERR_MODULE_NOT_FOUND: Cannot find package '<alias>'`.
//
// This discovers every npm-alias declared by an installed @mastra/* package,
// resolves it from the package that declares it, and copies it (under its alias
// name) into every build-output node_modules that contains @mastra packages.

import fs from "node:fs";
import path from "node:path";

// 1. Discover { alias -> resolved real package dir } from the pnpm store.
const aliasDirs = {};
const PNPM = path.join("node_modules", ".pnpm");

// Resolve an alias to its real dir by locating it as a sibling in the consuming
// package's node_modules and following the symlink. Avoids require.resolve, which
// fails for packages whose `exports` map doesn't expose ./package.json.
function resolveAliasDir(consumingDir, alias) {
	const parts = consumingDir.split(path.sep);
	const i = parts.lastIndexOf("node_modules");
	if (i === -1) return null;
	const nmRoot = parts.slice(0, i + 1).join(path.sep);
	const candidate = path.join(nmRoot, alias);
	try {
		return fs.realpathSync(candidate);
	} catch {
		return null;
	}
}

function collectAliasesFrom(pkgDir) {
	let pkg;
	try {
		pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"));
	} catch {
		return;
	}
	for (const [name, spec] of Object.entries(pkg.dependencies ?? {})) {
		if (!String(spec).startsWith("npm:") || aliasDirs[name]) continue;
		const dir = resolveAliasDir(pkgDir, name);
		if (dir) {
			aliasDirs[name] = dir;
		} else {
			console.warn(`[patch-mastra-aliases] could not resolve ${name}`);
		}
	}
}

if (fs.existsSync(PNPM)) {
	for (const virt of fs.readdirSync(PNPM)) {
		const scopeDir = path.join(PNPM, virt, "node_modules", "@mastra");
		let pkgs;
		try {
			pkgs = fs.readdirSync(scopeDir);
		} catch {
			continue;
		}
		for (const pkg of pkgs) collectAliasesFrom(path.join(scopeDir, pkg));
	}
}

const aliases = Object.keys(aliasDirs);
if (aliases.length === 0) {
	console.log("[patch-mastra-aliases] no @mastra npm-aliases found; nothing to do");
	process.exit(0);
}

// 2. Find every build-output node_modules that contains @mastra packages.
const SEARCH_ROOTS = [".output", ".vercel", "dist"].filter((d) => fs.existsSync(d));
const targets = new Set();

function walk(dir, depth) {
	if (depth > 12) return;
	let entries;
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const full = path.join(dir, entry.name);
		if (entry.name === "node_modules") {
			if (fs.existsSync(path.join(full, "@mastra"))) targets.add(full);
			walk(full, depth + 1);
			continue;
		}
		walk(full, depth + 1);
	}
}

for (const root of SEARCH_ROOTS) walk(root, 0);

if (targets.size === 0) {
	console.log("[patch-mastra-aliases] no build output with @mastra found");
	process.exit(0);
}

// 3. Copy each alias into every target node_modules under its alias name.
let copied = 0;
for (const nm of targets) {
	for (const alias of aliases) {
		const dest = path.join(nm, alias);
		if (fs.existsSync(dest)) continue;
		fs.mkdirSync(path.dirname(dest), { recursive: true });
		fs.cpSync(aliasDirs[alias], dest, { recursive: true, dereference: true });
		copied++;
	}
	console.log(`[patch-mastra-aliases] patched ${nm}`);
}

console.log(
	`[patch-mastra-aliases] aliases: ${aliases.join(", ")} — copied ${copied} package(s)`,
);
