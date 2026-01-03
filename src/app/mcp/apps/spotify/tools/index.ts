import {
	checkSavedAlbumsTool,
	getAlbumsTool,
	getAlbumTracksTool,
	saveOrRemoveAlbumsTool,
} from "./albums";
import {
	addToQueueTool,
	addTracksToPlaylistTool,
	createPlaylistTool,
	pausePlaybackTool,
	playMusicTool,
	resumePlaybackTool,
	skipToNextTool,
	skipToPreviousTool,
} from "./playback";
import {
	getMyPlaylistsTool,
	getNowPlayingTool,
	getPlaylistTracksTool,
	getRecentlyPlayedTool,
	getUsersSavedTracksTool,
	searchSpotifyTool,
} from "./read";

export const spotifyTools = [
	// Read operations
	searchSpotifyTool,
	getNowPlayingTool,
	getMyPlaylistsTool,
	getPlaylistTracksTool,
	getRecentlyPlayedTool,
	getUsersSavedTracksTool,

	// Playback control
	playMusicTool,
	pausePlaybackTool,
	resumePlaybackTool,
	skipToNextTool,
	skipToPreviousTool,
	addToQueueTool,

	// Playlist management
	createPlaylistTool,
	addTracksToPlaylistTool,

	// Album operations
	getAlbumsTool,
	getAlbumTracksTool,
	saveOrRemoveAlbumsTool,
	checkSavedAlbumsTool,
];
