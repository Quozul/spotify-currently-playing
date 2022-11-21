const clientId = import.meta.env.VITE_SPOTIFY_ID;
export const redirect_uri = import.meta.env.VITE_REDIRECT_URI;
const scopes = "user-read-playback-state";

export const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
authorizeUrl.searchParams.set("response_type", "code");
authorizeUrl.searchParams.set("client_id", clientId);
authorizeUrl.searchParams.set("scope", scopes);
authorizeUrl.searchParams.set("redirect_uri", redirect_uri);

