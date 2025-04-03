import { json, type RequestHandler } from "@sveltejs/kit";
import { SPOTIFY_SECRET } from "$env/static/private";
import { PUBLIC_REDIRECT_URI, PUBLIC_SPOTIFY_ID } from "$env/static/public";
import { sql } from "$lib/db";

const authorizationToken = btoa(`${PUBLIC_SPOTIFY_ID}:${SPOTIFY_SECRET}`);

export type Token =
	| {
			access_token: string;
			token_type: string;
			expires_in: number;
			refresh_token: string;
			scope: string;
	  }
	| {
			error: string;
			error_description?: string;
	  };

export const POST: RequestHandler = async ({ request }) => {
	const { code } = await request.json();

	const form = new URLSearchParams();
	form.set("code", code);
	form.set("redirect_uri", PUBLIC_REDIRECT_URI);
	form.set("grant_type", "authorization_code");

	const res = await fetch("https://accounts.spotify.com/api/token", {
		body: form.toString(),
		mode: "cors",
		method: "post",
		headers: {
			Authorization: `Basic ${authorizationToken}`,
			"content-type": "application/x-www-form-urlencoded",
		},
	});

	const response: Token = await res.json();

	if (res.ok && "access_token" in response) {
		// Query the Spotify user endpoint to retrieve the user's ID
		const userRes = await fetch("https://api.spotify.com/v1/me", {
			headers: {
				Authorization: `Bearer ${response.access_token}`,
			},
		});
		const userData = await userRes.json();
		const userId = userData.id;
		if (!userId) {
			return json(
				{ error: "Could not retrieve user id from Spotify." },
				{ status: 400 },
			);
		}

		const uuid = crypto.randomUUID();

		const result = await sql`
      INSERT INTO tokens (uuid, user_id, access_token, token_type, expires_in, refresh_token, scope)
      VALUES (${uuid}, ${userId}, ${response.access_token}, ${response.token_type}, ${response.expires_in}, ${response.refresh_token}, ${response.scope})
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
	}

	return json(response, { status: 400 });
};
