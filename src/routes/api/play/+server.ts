import { json, type RequestHandler } from "@sveltejs/kit";
import { SPOTIFY_SECRET } from "$env/static/private";
import { PUBLIC_SPOTIFY_ID } from "$env/static/public";
import { sql } from "$lib/db";
import type { Tokens } from "../token/+server";

const authorizationToken = btoa(`${PUBLIC_SPOTIFY_ID}:${SPOTIFY_SECRET}`);

interface SpotifyResponse {
	progress_ms: number;
	is_playing: boolean;
	item: {
		album: {
			images: {
				url: string;
				height: number;
				width: number;
			}[];
		};
		artists: {
			name: string;
		}[];
		duration_ms: number;
		name: string;
	};
}

type TokenRow = {
	refresh_token: string;
	access_token: string;
	created_at: number;
	expires_in: number;
};

export const GET: RequestHandler = async ({ url }) => {
	const uuid = url.searchParams.get("uuid");

	if (!uuid) {
		return json({ error: "UUID is required" }, { status: 400 });
	}

	const tokens = await sql`
    SELECT refresh_token, created_at, expires_in, access_token
    FROM tokens
    WHERE uuid = ${uuid}
  `;
	if (tokens.length === 0) {
		return json({ error: "Token not found" }, { status: 404 });
	}
	let tokenRow = tokens[0] as TokenRow;

	const createdAt = new Date(tokenRow.created_at);
	const expiresIn: number = tokenRow.expires_in;
	const expiryTime = new Date(createdAt.getTime() + expiresIn * 1000);
	let accessToken: string = tokenRow.access_token;

	const isExpired = new Date() >= expiryTime;
	if (isExpired) {
		const newAccessToken = await refreshToken(tokenRow.refresh_token, uuid);
		if (newAccessToken === null) {
			return json(
				{ message: "Failed to refresh token, please log-in again." },
				{ status: 400 },
			);
		}
		accessToken = newAccessToken;
	}

	const currentlyPlayingRes = await fetch(
		"https://api.spotify.com/v1/me/player/currently-playing",
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	);

	if (!currentlyPlayingRes.ok) {
		return json(
			{ error: "Failed to fetch currently playing media" },
			{ status: currentlyPlayingRes.status },
		);
	}

	const currentlyPlayingData: SpotifyResponse =
		await currentlyPlayingRes.json();

	return json({
		artworkUrl: currentlyPlayingData.item.album.images[0].url,
		name: currentlyPlayingData.item.name,
		artists: currentlyPlayingData.item.artists.map((artist) => artist.name),
		isPlaying: currentlyPlayingData.is_playing,
		progress: currentlyPlayingData.progress_ms,
		duration: currentlyPlayingData.item.duration_ms,
	});
};

async function refreshToken(
	refreshToken: string,
	uuid: string,
): Promise<string | null> {
	const form = new URLSearchParams();
	form.set("grant_type", "refresh_token");
	form.set("refresh_token", refreshToken);

	const refreshRes = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			Authorization: `Basic ${authorizationToken}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: form.toString(),
	});

	if (!refreshRes.ok) {
		return null;
	}

	const refreshData: Tokens = await refreshRes.json();

	if ("access_token" in refreshData) {
		const accessToken = refreshData.access_token;
		const updatedRefreshToken = refreshData.refresh_token || refreshToken;
		const updatedExpiresIn: number = refreshData.expires_in;

		await sql`
      UPDATE tokens
      SET access_token  = ${accessToken},
          refresh_token = ${updatedRefreshToken},
          expires_in    = ${updatedExpiresIn},
          created_at    = NOW()
      WHERE uuid = ${uuid}
    `;

		return accessToken;
	}
	return null;
}
