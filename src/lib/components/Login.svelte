<script lang="ts">
import { authorizeUrl } from "$lib/constants";
import { login } from "$lib/utils";
import { onMount } from "svelte";
import { goto } from "$app/navigation";

onMount(() => {
	const search = new URLSearchParams(window.location.search);

	if (search.has("code")) {
		const code = search.get("code");

		if (typeof code === "string") {
			login(code)
				.then((uuid) => {
					goto(`/player/${uuid}`);
				})
				.catch((error) => {
					console.error(error);
					goto("/");
				});
		}
	}
});
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
