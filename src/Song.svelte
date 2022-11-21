<script lang="ts">
	import {writable} from "svelte/store";
	import {onDestroy} from "svelte";

	const currentlyPlaying = writable(null);

	const search = new URLSearchParams(window.location.search);
	const token = search.get("access_token");

	let interval: number = null;

	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
        }
    });

	if (search.has("access_token")) {
		if (token) {
			setInterval(fetchPlayer, 5000, token);
			fetchPlayer(token);
		}
	}

	function fetchPlayer(token: string) {
		fetch("https://api.spotify.com/v1/me/player", {
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/json",
				"Authorization": `Bearer ${token}`,
			}
		})
			.then(res => res.json())
			.then(json => {
				$currentlyPlaying = json;
			})
            .catch(() => {
				$currentlyPlaying = null;
            });
	}

	let name = "", artist = "", image = "", isPlaying = false, slide: boolean;
	$: if ($currentlyPlaying) {
		name = $currentlyPlaying.item.name;
		artist = $currentlyPlaying.item.artists[0].name;
		image = $currentlyPlaying.item.album.images[0].url;
		isPlaying = $currentlyPlaying.is_playing;
	}

	let nameElement: number = 0;
	let container: number = 0;

	$: slide = nameElement > container;
</script>

<style>
    .container {
        width: 350px;
        height: 70px;
    }

    .active {
        width: 350px;
    }

    .img {
        width: 70px;
        height: 70px;
        z-index: 100;
    }

    .slide {
        position: absolute;
        animation: slide 5s infinite alternate ease-in-out;
    }

    @keyframes slide {
        0%, 15% {
            transform: translateX(0);
        }

        85%, 100% {
            transform: translateX(var(--width));
        }
    }
</style>

<div class="shadow-black/50 shadow-xl rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 container transition-all duration-500"
     class:active={isPlaying}>
    <div class="flex">
        <img src="{image}" alt="artwork" class="img rounded-xl"/>

        <div class="flex-grow p-2 overflow-hidden relative">
            <h2 class="artist bg-gradient-to-r from-purple-800 to-red-800 bg-clip-text text-transparent font-black uppercase">
                {artist}
            </h2>

            <div class="font-bold text-xl text-white whitespace-nowrap text-2xl"
                 class:slide={slide}
                 style="--width: {container - nameElement}px;"
                 bind:clientWidth={container}
            >
                <div class="inline-block" bind:clientWidth={nameElement}>
                    {name}
                </div>
            </div>
        </div>
    </div>
</div>
