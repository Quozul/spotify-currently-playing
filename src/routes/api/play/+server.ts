import { json, type RequestHandler } from "@sveltejs/kit";
import { SPOTIFY_SECRET } from "$env/static/private";
import { PUBLIC_SPOTIFY_ID } from "$env/static/public";
import { sql } from "$lib/db";

const authorizationToken = btoa(`${PUBLIC_SPOTIFY_ID}:${SPOTIFY_SECRET}`);

interface SpotifyResponse {
	device: {
		id: string;
		is_active: boolean;
		is_private_session: boolean;
		is_restricted: boolean;
		name: string;
		type: string;
		volume_percent: number;
		supports_volume: boolean;
	};
	repeat_state: string;
	shuffle_state: boolean;
	context: {
		type: string;
		href: string;
		external_urls: {
			spotify: string;
		};
		uri: string;
	};
	timestamp: number;
	progress_ms: number;
	is_playing: boolean;
	item: {
		album: {
			album_type: string;
			total_tracks: number;
			available_markets: string[];
			external_urls: {
				spotify: string;
			};
			href: string;
			id: string;
			images: {
				url: string;
				height: number;
				width: number;
			}[];
			name: string;
			release_date: string;
			release_date_precision: string;
			restrictions?: {
				reason: string;
			};
			type: string;
			uri: string;
			artists: {
				external_urls: {
					spotify: string;
				};
				href: string;
				id: string;
				name: string;
				type: string;
				uri: string;
			}[];
		};
		artists: {
			external_urls: {
				spotify: string;
			};
			href: string;
			id: string;
			name: string;
			type: string;
			uri: string;
		}[];
		available_markets: string[];
		disc_number: number;
		duration_ms: number;
		explicit: boolean;
		external_ids: {
			isrc: string;
			ean: string;
			upc: string;
		};
		external_urls: {
			spotify: string;
		};
		href: string;
		id: string;
		is_playable: boolean;
		linked_from?: Record<string, unknown>;
		restrictions?: {
			reason: string;
		};
		name: string;
		popularity: number;
		preview_url: string;
		track_number: number;
		type: string;
		uri: string;
		is_local: boolean;
	};
	currently_playing_type: string;
	actions: {
		interrupting_playback: boolean;
		pausing: boolean;
		resuming: boolean;
		seeking: boolean;
		skipping_next: boolean;
		skipping_prev: boolean;
		toggling_repeat_context: boolean;
		toggling_shuffle: boolean;
		toggling_repeat_track: boolean;
		transferring_playback: boolean;
	};
}

export const GET: RequestHandler = async ({ url }) => {
	const uuid = url.searchParams.get("uuid");

	if (!uuid) {
		return json({ error: "UUID is required" }, { status: 400 });
	}

	// 1. Retrieve token details from the database using the UUID.
	const tokens = await sql`
    SELECT * FROM tokens WHERE uuid = ${uuid}
  `;
	if (tokens.length === 0) {
		return json({ error: "Token not found" }, { status: 404 });
	}
	let tokenRow = tokens[0];

	// 2. Determine if the access token has expired.
	//    We assume that the 'created_at' column holds the time the token was stored
	//    and that 'expires_in' holds the lifetime in seconds.
	const createdAt = new Date(tokenRow.created_at);
	const expiresIn: number = tokenRow.expires_in;
	const expiryTime = new Date(createdAt.getTime() + expiresIn * 1000);
	let accessToken: string = tokenRow.access_token;

	// 3. If expired, refresh the token.
	if (new Date() >= expiryTime) {
		const form = new URLSearchParams();
		form.set("grant_type", "refresh_token");
		form.set("refresh_token", tokenRow.refresh_token);

		const refreshRes = await fetch("https://accounts.spotify.com/api/token", {
			method: "POST",
			headers: {
				Authorization: `Basic ${authorizationToken}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: form.toString(),
		});

		if (!refreshRes.ok) {
			return json({ error: "Failed to refresh token" }, { status: 400 });
		}

		const refreshData = await refreshRes.json();

		// Use the new access token.
		accessToken = refreshData.access_token;
		// Use new refresh token if provided; otherwise, keep the existing one.
		const updatedRefreshToken =
			refreshData.refresh_token || tokenRow.refresh_token;
		const updatedExpiresIn: number = refreshData.expires_in;

		// Update the token details in the database, also update created_at.
		const updated = await sql`
      UPDATE tokens
      SET access_token = ${accessToken},
          refresh_token = ${updatedRefreshToken},
          expires_in = ${updatedExpiresIn},
          created_at = NOW()
      WHERE uuid = ${uuid}
      RETURNING *
    `;
		tokenRow = updated[0];
	}

	// 4. Use the valid access token to query the Spotify "currently playing" endpoint.
	const currentlyPlayingRes = await fetch(
		"https://api.spotify.com/v1/me/player/currently-playing",
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	);

	// If no media is playing, Spotify may return a 204 (no content).
	if (currentlyPlayingRes.status === 204) {
		return json({ message: "No content is currently playing." });
	}
	if (!currentlyPlayingRes.ok) {
		return json(
			{ error: "Failed to fetch currently playing media" },
			{ status: currentlyPlayingRes.status },
		);
	}

	const currentlyPlayingData: SpotifyResponse =
		await currentlyPlayingRes.json();

	// 5. Return the currently playing media data.
	return json({
		artworkUrl: currentlyPlayingData.item.album.images[0].url,
		name: currentlyPlayingData.item.name,
		artists: currentlyPlayingData.item.artists.map((artist) => artist.name),
		isPlaying: currentlyPlayingData.is_playing,
		progress: currentlyPlayingData.progress_ms,
		duration: currentlyPlayingData.item.duration_ms,
	});
};
