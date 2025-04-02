import { json, type RequestHandler } from "@sveltejs/kit";
import {
	POSTGRES_DATABASE,
	POSTGRES_PASSWORD,
	POSTGRES_USER,
	SPOTIFY_SECRET,
} from "$env/static/private";
import { PUBLIC_SPOTIFY_ID } from "$env/static/public";
import postgres from "postgres";

const sql = postgres({
	username: POSTGRES_USER,
	password: POSTGRES_PASSWORD,
	database: POSTGRES_DATABASE,
});
const authorizationToken = btoa(`${PUBLIC_SPOTIFY_ID}:${SPOTIFY_SECRET}`);

export const GET: RequestHandler = async ({ params, url }) => {
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

	const currentlyPlayingData = await currentlyPlayingRes.json();

	// 5. Return the currently playing media data.
	return json(currentlyPlayingData);
};
