<script lang="ts">
	import Song from "./Song.svelte";
	import Login from "./Login.svelte";
	import {token} from "./store/store";
	import Copy from "./Share.svelte";
	import {fetchRefreshToken} from "./utils";

	let refreshTimeout = null;

	// If store has a refresh token
	$: if ($token && $token.refresh_token && $token.expires_at) {
		if (refreshTimeout) {
			clearTimeout(refreshTimeout); // Clear previous timout
        }

		// Create timeout to refresh token
		const expiresIn = Math.max(0, $token.expires_at - Date.now());
		refreshTimeout = setTimeout(fetchRefreshToken, expiresIn, $token.refresh_token);
		console.log(`Refreshing token in ${expiresIn/1000} seconds.`);
	}

	// If a refresh token is in hash, use it to get a new one
	$: if (window.location.hash.length > 1) {
		const refreshToken = window.location.hash.substring(1);
		console.log("Found refresh token.", refreshToken);
		window.location.hash = "";
		fetchRefreshToken(refreshToken);
    }

	// If token in store is invalid
	$: if ($token?.error) {
        $token = null; // Clear token if error
    }
</script>

<div class="flex justify-center items-center min-h-screen">
    {#if !$token?.access_token}
        <Login/>
    {:else}
        <div class="flex flex-col gap-5">
            <Copy/>
            <Song/>
        </div>
    {/if}
</div>