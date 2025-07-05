import {
	addVideoToPlaylistTool,
	createPlaylistTool,
	listPlaylistVideosTool,
	removeVideoFromPlaylistTool,
} from "./playlists";
import { searchVideosTool, uploadVideoTool } from "./videos";

export const youtubeTools = [
	// Video tools
	searchVideosTool,
	uploadVideoTool,

	// Playlist tools
	createPlaylistTool,
	addVideoToPlaylistTool,
	removeVideoFromPlaylistTool,
	listPlaylistVideosTool,
];
