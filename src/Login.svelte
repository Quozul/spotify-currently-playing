<script lang="ts">
	import {authorizeUrl} from "./constants";
	import {token} from "./store/store";

	const search = new URLSearchParams(window.location.search);

	if (search.has("code")) {
		const code = search.get("code");
		fetch(import.meta.env.VITE_API_BASE + "token", {
			method: "post",
			body: JSON.stringify({code}),
			headers: {
				"content-type": "application/json",
				"accept": "application/json",
			}
		})
			.then(res => {
				if (res.ok) {
					res.json()
						.then(json => {
							const expiresAt = Date.now() + json.expires_in * 1000;

							const params = new URLSearchParams();
							params.set("access_token", json.access_token);
							params.set("refresh_token", json.refresh_token);
							params.set("expires_at", expiresAt.toString());
							window.location.search = params.toString();

							$token = json;
						});
				} else {
					window.location.search = "";
				}
			});
	}
</script>

<style>
    .bg-spot {
        background-color: #1DB964;
        padding: 18px 48px;
    }
</style>

<a class="bg-spot rounded-full font-bold inline-block active:scale-95 hover:scale-105 transition-all"
   href="{authorizeUrl.href}">
    <img class="h-16" src="/Spotify_Logo_RGB_White.png"/>
</a>