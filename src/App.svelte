<script lang="ts">
	import Song from "./Song.svelte";
	import Login from "./Login.svelte";
	import {token} from "./store/store";

	const search = new URLSearchParams(window.location.search);
	const accessToken = search.get("access_token");
	const refreshToken = search.get("refresh_token");
	const expiresAt = parseInt(search.get("expires_at"));

	let refreshTimeout = null;

	function fetchRefreshToken() {
		console.log(`Refreshing token...`);
		fetch(import.meta.env.VITE_API_BASE + "refresh", {
			body: JSON.stringify({refreshToken}),
			method: "post",
			headers: {
				"content-type": "application/json",
				"accept": "application/json",
			},
		})
			.then(res => {
				if (res.ok) {
					res.json()
						.then(json => {
							$token = json;
						});
				} else {
					window.location.search = "";
				}
			});
    }

	// If store has a refresh token
	$: if ($token && $token.refresh_token) {
        // Clear previous timout
		if (refreshTimeout) {
			clearTimeout(refreshTimeout);
        }

		const expiresIn = Math.max(0, expiresAt - Date.now());
		refreshTimeout = setTimeout(fetchRefreshToken, expiresIn);
		console.log(`Refreshing token in ${expiresIn/1000} seconds.`);
	}

	// If token is in store
	$: if ($token) {
		const search = new URLSearchParams(window.location.search);
		const accessToken = search.get("access_token");

		// If previous token is different from the stored token
		if (accessToken !== $token.access_token) {
			console.log("Restored previous token.");
			const expiresAt = Date.now() + $token.expires_in * 1000;

			const params = new URLSearchParams();
			params.set("access_token", $token.access_token);
			params.set("refresh_token", $token.refresh_token);
			params.set("expires_at", expiresAt.toString());

			window.location.search = params.toString();
		}
	}
</script>

<div class="flex justify-center items-center min-h-screen">
    {#if !accessToken}
        <Login/>
    {:else}
        <Song/>
    {/if}
</div>