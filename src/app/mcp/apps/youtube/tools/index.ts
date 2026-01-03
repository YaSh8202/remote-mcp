// Video management tools

// Analysis tools
import {
	analyzeVideoSentimentTool,
	extractKeyTopicsTool,
	generateTimestampsTool,
	generateVideoSummaryTool,
} from "./analysis";
// Analytics tools
import {
	compareVideosTool,
	getChannelAnalyticsTool,
	getTrendingVideosTool,
	getVideoAnalyticsTool,
	getVideoCategoresTool,
} from "./analytics";
// Channel management tools
import {
	getChannelByUsernameTool,
	getChannelPlaylistsTool,
	getChannelTool,
	getChannelVideosTool,
	searchChannelsTool,
} from "./channels";
// Playlist management tools
import {
	getPlaylistItemsTool,
	getPlaylistTool,
	getPlaylistVideoDetailsTool,
	searchPlaylistsTool,
} from "./playlists";
// Transcript management tools
import {
	getTranscriptLanguagesTool,
	getTranscriptSummaryTool,
	getTranscriptTextTool,
	getTranscriptTool,
	searchTranscriptTool,
} from "./transcripts";
import {
	getVideoCommentsTool,
	getVideoStatsTool,
	getVideoTool,
	searchVideosTool,
} from "./videos";

export const youtubeTools = [
	// Video management tools
	getVideoTool,
	searchVideosTool,
	getVideoStatsTool,
	getVideoCommentsTool,

	// Channel management tools
	getChannelTool,
	getChannelVideosTool,
	getChannelPlaylistsTool,
	searchChannelsTool,
	getChannelByUsernameTool,

	// Playlist management tools
	getPlaylistTool,
	getPlaylistItemsTool,
	searchPlaylistsTool,
	getPlaylistVideoDetailsTool,

	// Transcript management tools
	getTranscriptTool,
	getTranscriptTextTool,
	searchTranscriptTool,
	getTranscriptSummaryTool,
	getTranscriptLanguagesTool,

	// Analytics tools
	getVideoAnalyticsTool,
	getChannelAnalyticsTool,
	compareVideosTool,
	getTrendingVideosTool,
	getVideoCategoresTool,

	// Analysis tools
	analyzeVideoSentimentTool,
	generateVideoSummaryTool,
	extractKeyTopicsTool,
	generateTimestampsTool,
];
