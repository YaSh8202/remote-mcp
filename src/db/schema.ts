import { relations } from "drizzle-orm";
import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const sessions = pgTable("sessions", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	token: text("token").notNull().unique(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const accounts = pgTable("accounts", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	expiresAt: timestamp("expires_at", { withTimezone: true }),
	accessTokenExpiresAt: timestamp("access_token_expires_at", {
		withTimezone: true,
	}),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
		withTimezone: true,
	}),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const verifications = pgTable("verifications", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export enum AppConnectionStatus {
	ACTIVE = "ACTIVE",
	MISSING = "MISSING",
	ERROR = "ERROR",
}

export enum AppConnectionType {
	OAUTH2 = "OAUTH2",
	NO_AUTH = "NO_AUTH",
}

export const appConnections = pgTable("app_connections", {
	id: text("id").primaryKey(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	displayName: text("display_name").notNull(),
	type: text("type").$type<AppConnectionType>().notNull(),
	status: text("status")
		.$type<AppConnectionStatus>()
		.notNull()
		.default(AppConnectionStatus.ACTIVE),
	appName: text("app_name").notNull(),
	ownerId: text("owner_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	value: jsonb("value").$type<EncryptedObject>().notNull(),
});

export enum McpRunStatus {
	SUCCESS = "SUCCESS",
	FAILED = "FAILED",
}

export const mcpServer = pgTable("mcp_server", {
	id: text("id").primaryKey(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	name: text("name").notNull(),
	ownerId: text("owner_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	token: text("token").notNull(),
});

export const mcpApps = pgTable("mcp_apps", {
	id: text("id").primaryKey(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	appName: text("app_name").notNull(),
	serverId: text("server_id")
		.notNull()
		.references(() => mcpServer.id, { onDelete: "cascade" }),
	tools: jsonb("tools").$type<string[]>().notNull(),
});

export const mcpRuns = pgTable("mcp_runs", {
	id: text("id").primaryKey(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	serverId: text("server_id")
		.notNull()
		.references(() => mcpServer.id, { onDelete: "cascade" }),
	appId: text("app_id")
		.notNull()
		.references(() => mcpApps.id, { onDelete: "cascade" }),
	toolName: text("tool_name").notNull(),
	metadata: jsonb("metadata")
		.$type<{ appName: string; toolName: string }>()
		.notNull(),
	// biome-ignore lint/suspicious/noExplicitAny:  mcp run input can be any JSON structure
	input: jsonb("input").$type<{ [x: string]: any }>().notNull(),
	// biome-ignore lint/suspicious/noExplicitAny: mcp run output can be any JSON structure
	output: jsonb("output").$type<{ [x: string]: any }>().notNull(),
	status: text("status").$type<McpRunStatus>().notNull(),
	ownerId: text("owner_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
});

export type EncryptedObject = {
	iv: string;
	data: string;
};

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Verification = typeof verifications.$inferSelect;
export type AppConnection = typeof appConnections.$inferSelect;
export type NewAppConnection = typeof appConnections.$inferInsert;
export type McpServer = typeof mcpServer.$inferSelect;
export type NewMcpServer = typeof mcpServer.$inferInsert;
export type McpApp = typeof mcpApps.$inferSelect;
export type NewMcpApp = typeof mcpApps.$inferInsert;
export type McpRun = typeof mcpRuns.$inferSelect;
export type NewMcpRun = typeof mcpRuns.$inferInsert;

// Database Relations
export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	accounts: many(accounts),
	appConnections: many(appConnections),
	mcpServers: many(mcpServer),
	mcpRuns: many(mcpRuns),
}));

export const mcpServerRelations = relations(mcpServer, ({ one, many }) => ({
	owner: one(users, {
		fields: [mcpServer.ownerId],
		references: [users.id],
	}),
	apps: many(mcpApps),
	runs: many(mcpRuns),
}));

export const mcpAppsRelations = relations(mcpApps, ({ one, many }) => ({
	server: one(mcpServer, {
		fields: [mcpApps.serverId],
		references: [mcpServer.id],
	}),
	runs: many(mcpRuns),
}));

export const mcpRunsRelations = relations(mcpRuns, ({ one }) => ({
	server: one(mcpServer, {
		fields: [mcpRuns.serverId],
		references: [mcpServer.id],
	}),
	app: one(mcpApps, {
		fields: [mcpRuns.appId],
		references: [mcpApps.id],
	}),
	owner: one(users, {
		fields: [mcpRuns.ownerId],
		references: [users.id],
	}),
}));

export const appConnectionsRelations = relations(appConnections, ({ one }) => ({
	owner: one(users, {
		fields: [appConnections.ownerId],
		references: [users.id],
	}),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id],
	}),
}));
