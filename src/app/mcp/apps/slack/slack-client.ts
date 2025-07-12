import type { OAuth2Props } from "@/app/mcp/mcp-app/property";
import type { OAuth2Property } from "@/app/mcp/mcp-app/property/authentication/oauth2-prop";
import { WebClient } from "@slack/web-api";
import type { McpRequestHandlerExtra } from "../../mcp-app/tools";

/**
 * Creates a Slack WebClient using the OAuth2 access token
 */
export function createSlackClient(extra: McpRequestHandlerExtra<OAuth2Property<OAuth2Props>>): WebClient {
  if (!extra.auth?.access_token) {
    throw new Error("No access token available for Slack API");
  }
  
  return new WebClient(extra.auth.access_token);
}

/**
 * Format error messages from Slack API responses
 */
export function formatSlackError(error: unknown): string {
  if (error instanceof Error) {
    return `Slack API Error: ${error.message}`;
  }
  
  return `Slack API Error: ${String(error)}`;
}

/**
 * Parse the channel ID or name format to handle #general or @username_dm formats
 */
export function parseChannelId(channelId: string): string {
  // If the channel ID starts with # or @, it's a channel or user name
  // In a real implementation, we would need to look up the actual ID
  // For now, we'll just return the ID as is
  return channelId;
}

/**
 * Format a message for display
 */
export function formatMessage(message: Record<string, unknown>): Record<string, unknown> {
  // In a real implementation, we would format the message properly
  // For now, we'll just return the message as is
  return message;
}
