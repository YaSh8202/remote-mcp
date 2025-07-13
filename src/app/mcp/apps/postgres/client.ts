import { Pool } from "pg";
import type { PoolClient, QueryResult } from "pg";

export interface PostgreSQLResult {
	rows: Array<Record<string, unknown>>;
	rowCount: number | null;
	command: string;
	fields: Array<{
		name: string;
		dataTypeID: number;
		dataTypeSize: number;
		dataTypeModifier: number;
		format: string;
	}>;
}

interface PostgreSQLError extends Error {
	code?: string;
}

function isPostgreSQLError(error: unknown): error is PostgreSQLError {
	return error instanceof Error;
}

export class PostgreSQLClient {
	private pool: Pool | null = null;
	private connectionString: string;

	constructor(connectionString: string) {
		this.connectionString = connectionString;
	}

	private async getPool(): Promise<Pool> {
		if (!this.pool) {
			this.pool = new Pool({
				connectionString: this.connectionString,
				max: 5,
				idleTimeoutMillis: 30000,
				connectionTimeoutMillis: 30000,
				statement_timeout: 60000,
				query_timeout: 60000,
				ssl: this.connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
			});
		}
		return this.pool;
	}

	async query(sql: string, params?: unknown[]): Promise<PostgreSQLResult> {
		const pool = await this.getPool();
		let client: PoolClient | null = null;
		let retries = 3;
		
		while (retries > 0) {
			try {
				client = await pool.connect();
				
				// Set a statement timeout for this specific query
				await client.query('SET statement_timeout = 60000');
				
				const result: QueryResult = await client.query(sql, params);
				
				return {
					rows: result.rows,
					rowCount: result.rowCount,
					command: result.command,
					fields: result.fields?.map(field => ({
						name: field.name,
						dataTypeID: field.dataTypeID,
						dataTypeSize: field.dataTypeSize,
						dataTypeModifier: field.dataTypeModifier,
						format: field.format,
					})) || [],
				};
			} catch (error: unknown) {
				retries--;
				if (client) {
					client.release();
					client = null;
				}
				
				// Check if it's a connection timeout or connection issue
				const isConnectionError = isPostgreSQLError(error) && (
					error.code === 'ETIMEDOUT' || 
					error.code === 'ECONNRESET' || 
					error.message?.includes('timeout') ||
					error.message?.includes('Connection terminated')
				);
				
				if (isConnectionError && retries > 0) {
					console.log(`Connection error, retrying... (${retries} attempts left)`);
					await new Promise(resolve => setTimeout(resolve, 1000));
					continue;
				}
				
				throw error;
			} finally {
				if (client) {
					client.release();
				}
			}
		}
		
		throw new Error('Failed to execute query after multiple retries');
	}

	async testConnection(): Promise<boolean> {
		try {
			const result = await this.query("SELECT 1 as test");
			return result.rows.length === 1 && result.rows[0].test === 1;
		} catch (error) {
			return false;
		}
	}

	async close(): Promise<void> {
		if (this.pool) {
			await this.pool.end();
			this.pool = null;
		}
	}

	// Helper method to format query results as text
	formatResultAsText(result: PostgreSQLResult): string {
		if (result.rowCount === 0) {
			return "Query executed successfully. No rows returned.";
		}

		if (!result.rows || result.rows.length === 0) {
			return `Command: ${result.command}\nRows affected: ${result.rowCount || 0}`;
		}

		// Format as table
		const headers = Object.keys(result.rows[0]);
		const maxWidths = headers.reduce((acc, header) => {
			acc[header] = Math.max(
				header.length,
				...result.rows.map(row => String(row[header] || "").length)
			);
			return acc;
		}, {} as Record<string, number>);

		let output = "";
		
		// Header row
		output += `| ${headers.map(h => h.padEnd(maxWidths[h])).join(" | ")} |\n`;
		
		// Separator row
		output += `| ${headers.map(h => "-".repeat(maxWidths[h])).join(" | ")} |\n`;
		
		// Data rows
		for (const row of result.rows) {
			output += `| ${headers.map(h => String(row[h] || "").padEnd(maxWidths[h])).join(" | ")} |\n`;
		}
		
		output += `\n(${result.rowCount} row${result.rowCount === 1 ? "" : "s"})`;
		
		return output;
	}
}

// Helper function to validate connection string
export function validateConnectionString(connectionString: string): boolean {
	try {
		const url = new URL(connectionString);
		return url.protocol === "postgresql:" || url.protocol === "postgres:";
	} catch {
		return false;
	}
}

// Helper function to obfuscate password in connection string for logging
export function obfuscateConnectionString(connectionString: string): string {
	try {
		const url = new URL(connectionString);
		if (url.password) {
			url.password = "***";
		}
		return url.toString();
	} catch {
		return "Invalid connection string";
	}
}
