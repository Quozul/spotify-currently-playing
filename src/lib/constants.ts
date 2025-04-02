import { PUBLIC_REDIRECT_URI, PUBLIC_SPOTIFY_ID } from "$env/static/public";

const scopes = "user-read-playback-state";

export const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
authorizeUrl.searchParams.set("response_type", "code");
authorizeUrl.searchParams.set("client_id", PUBLIC_SPOTIFY_ID);
authorizeUrl.searchParams.set("scope", scopes);
authorizeUrl.searchParams.set("redirect_uri", PUBLIC_REDIRECT_URI);
