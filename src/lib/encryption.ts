import * as crypto from "node:crypto";
import { env } from "@/env";

import { z } from "zod/v4";

export const EncryptedObject = z.object({
	iv: z.string(),
	data: z.string(),
});

const algorithm = "aes-256-cbc";
const ivLength = 16;
const secret = env.ENCRYPTION_KEY;

export type EncryptedObject = z.infer<typeof EncryptedObject>;

function encryptString(inputString: string): EncryptedObject {
	const iv = crypto.randomBytes(ivLength); // Generate a random initialization vector
	const secret = env.ENCRYPTION_KEY;
	const key = Buffer.from(secret, "binary");
	const cipher = crypto.createCipheriv(algorithm, key, iv); // Create a cipher with the key and initialization vector
	let encrypted = cipher.update(inputString, "utf8", "hex");
	encrypted += cipher.final("hex");
	return {
		iv: iv.toString("hex"),
		data: encrypted,
	};
}

export function encryptObject(object: unknown): EncryptedObject {
	const objectString = JSON.stringify(object); // Convert the object to a JSON string
	return encryptString(objectString);
}

export function decryptObject<T>(encryptedObject: EncryptedObject): T {
	const iv = Buffer.from(encryptedObject.iv, "hex");
	const key = Buffer.from(secret, "binary");
	const decipher = crypto.createDecipheriv(algorithm, key, iv);
	let decrypted = decipher.update(encryptedObject.data, "hex", "utf8");
	decrypted += decipher.final("utf8");
	return JSON.parse(decrypted);
}
export function decryptString(encryptedObject: EncryptedObject): string {
	const iv = Buffer.from(encryptedObject.iv, "hex");
	const key = Buffer.from(secret, "binary");
	const decipher = crypto.createDecipheriv(algorithm, key, iv);
	let decrypted = decipher.update(encryptedObject.data, "hex", "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
}
