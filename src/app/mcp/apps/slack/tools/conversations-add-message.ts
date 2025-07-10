import { createParameterizedTool } from "@/app/mcp/mcp-app/tools";
import { z } from "zod";
import { slackAuth } from "../common";
import { createSlackClient, formatSlackError, parseChannelId } from "../slack-client";

export const conversationsAddMessageTool = createParameterizedTool({
  name: "conversations_add_message",
  auth: slackAuth,
  description: "Add a message to a public channel, private channel, or direct message (DM, or IM) conversation by channel_id and thread_ts.",
  paramsSchema: {
    channel_id: z.string().describe("ID of the channel in format Cxxxxxxxxxx or its name starting with #... or @... aka #general or @username_dm."),
    thread_ts: z.string().optional().describe("Unique identifier of either a thread's parent message or a message in the thread_ts must be the timestamp in format 1234567890.123456 of an existing message with 0 or more replies. Optional, if not provided the message will be added to the channel itself, otherwise it will be added to the thread."),
    payload: z.string().describe("Message payload in specified content_type format. Example: 'Hello, world!' for text/plain or '# Hello, world!' for text/markdown."),
    content_type: z.string().default("text/markdown").describe("Content type of the message. Default is 'text/markdown'. Allowed values: 'text/markdown', 'text/plain'."),
  },
  callback: async (params, extra) => {
    try {
      const client = createSlackClient(extra);
      const channelId = parseChannelId(params.channel_id);
      
      // Construct API parameters
      const apiParams: {
        channel: string;
        text: string;
        thread_ts?: string;
        mrkdwn?: boolean;
      } = {
        channel: channelId,
        text: params.payload,
      };
      
      // Add thread_ts if provided
      if (params.thread_ts) {
        apiParams.thread_ts = params.thread_ts;
      }
      
      // Handle content_type
      if (params.content_type === "text/markdown") {
        apiParams.mrkdwn = true;
      } else if (params.content_type === "text/plain") {
        apiParams.mrkdwn = false;
      }
      
      const result = await client.chat.postMessage(apiParams);
      
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ 
              message: {
                ts: result.ts,
                channel: result.channel
              }
            }),
          },
        ],
      };
    } catch (error) {
      console.error("Error sending message:", error);
      return {
        content: [
          {
            type: "text" as const,
            text: formatSlackError(error),
          },
        ],
      };
    }
  },
});
