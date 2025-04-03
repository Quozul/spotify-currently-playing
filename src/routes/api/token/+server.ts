import { json, type RequestHandler } from "@sveltejs/kit";
import { SPOTIFY_SECRET } from "$env/static/private";
import { PUBLIC_REDIRECT_URI, PUBLIC_SPOTIFY_ID } from "$env/static/public";
import { sql } from "$lib/db";

const authorizationToken = btoa(`${PUBLIC_SPOTIFY_ID}:${SPOTIFY_SECRET}`);

export type Tokens = {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
};

export type TokenError = {
	error: string;
	error_description?: string;
};

export const POST: RequestHandler = async ({ request }) => {
	const { code } = await request.json();

	const tokens = await getTokenFromCode(code);

	if (!tokens) {
		return json({ message: "Failed to fetch token" }, { status: 400 });
	}

	const userId = await getSpotifyUserId(tokens.access_token);
	if (!userId) {
		return json(
			{ error: "Could not retrieve user id from Spotify." },
			{ status: 400 },
		);
	}

	const uuid = crypto.randomUUID();

	const result = await sql`
		INSERT INTO tokens (uuid, user_id, access_token, token_type, expires_in, refresh_token, scope)
		VALUES (${uuid}, ${userId}, ${tokens.access_token}, ${tokens.token_type}, ${tokens.expires_in}, ${tokens.refresh_token}, ${tokens.scope})
		ON CONFLICT (user_id) DO UPDATE SET
			access_token = EXCLUDED.access_token,
			token_type = EXCLUDED.token_type,
			expires_in = EXCLUDED.expires_in,
			refresh_token = EXCLUDED.refresh_token,
			scope = EXCLUDED.scope,
			created_at = NOW()
		RETURNING uuid
	`;

	return json({ uuid: result[0].uuid });
};

async function getTokenFromCode(code: string): Promise<Tokens | null> {
	const form = new URLSearchParams();
	form.set("code", code);
	form.set("redirect_uri", PUBLIC_REDIRECT_URI);
	form.set("grant_type", "authorization_code");

	const response = await fetch("https://accounts.spotify.com/api/token", {
		body: form.toString(),
		mode: "cors",
		method: "post",
		headers: {
			Authorization: `Basic ${authorizationToken}`,
			"content-type": "application/x-www-form-urlencoded",
		},
	});

	if (!response.ok) {
		return null;
	}

	const json: Tokens | TokenError = await response.json();

	if ("access_token" in json) {
		return json;
	}

	return null;
}

type SpotifyUser = {
	id: string;
	display_name: string;
	email: string;
};

async function getSpotifyUserId(accessToken: string): Promise<string | null> {
	const response = await fetch("https://api.spotify.com/v1/me", {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});
	if (!response.ok) {
		return null;
	}
	const spotifyUser: SpotifyUser = await response.json();
	return spotifyUser.id;
}
