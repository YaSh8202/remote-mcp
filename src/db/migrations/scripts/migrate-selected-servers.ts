import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { chatMcpServers, chats } from "@/db/schema";
import { generateId } from "@/lib/id";

/**
 * Migration script to move selectedServers from chat.metadata to chat_mcp_servers table
 */
async function migrateSelectedServers() {
	console.log("Starting migration of selected servers...");

	try {
		// Get all chats that have selectedServers in metadata
		const chatsWithSelectedServers = await db
			.select()
			.from(chats)
			.where(
				and(
					isNotNull(chats.metadata),
					// We need to check if metadata has selectedServers property
				),
			);

		console.log(`Found ${chatsWithSelectedServers.length} chats to process`);

		let migratedCount = 0;
		let errorCount = 0;

		for (const chat of chatsWithSelectedServers) {
			try {
				const metadata = chat.metadata;

				// Check if selectedServers exists and is an array
				if (
					metadata?.selectedServers &&
					Array.isArray(metadata.selectedServers)
				) {
					console.log(
						`Processing chat ${chat.id} with ${metadata.selectedServers.length} selected servers`,
					);

					// Create chat_mcp_servers records for each selected server
					for (const serverId of metadata.selectedServers) {
						if (typeof serverId === "string") {
							await db.insert(chatMcpServers).values({
								id: generateId(),
								chatId: chat.id,
								isRemoteMcp: true,
								mcpServerId: serverId,
								tools: [],
								includeAllTools: true,
							});
						}
					}

					// Remove selectedServers from metadata
					const updatedMetadata = { ...metadata };
					delete updatedMetadata.selectedServers;

					// Update the chat to remove selectedServers from metadata
					await db
						.update(chats)
						.set({ metadata: updatedMetadata })
						.where(eq(chats.id, chat.id));

					migratedCount++;
					console.log(`✓ Migrated chat ${chat.id}`);
				}
			} catch (error) {
				console.error(`✗ Error migrating chat ${chat.id}:`, error);
				errorCount++;
			}
		}

		console.log("\nMigration completed!");
		console.log(`- Successfully migrated: ${migratedCount} chats`);
		console.log(`- Errors: ${errorCount} chats`);
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	}
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	migrateSelectedServers()
		.then(() => {
			console.log("Migration script completed successfully");
			process.exit(0);
		})
		.catch((error) => {
			console.error("Migration script failed:", error);
			process.exit(1);
		});
}

export { migrateSelectedServers };
