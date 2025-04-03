<script lang="ts">
import { onDestroy, onMount } from "svelte";
const { uuid } = $props();

type CurrentSong = {
  artworkUrl: string,
  name: string,
  artists: string,
  isPlaying: boolean,
  progress: number,
  duration: number,
}

let currentlyPlaying = $state<CurrentSong | null>(null);
let interval = $state<number | null>(null);

onDestroy(() => {
	if (interval) {
		clearInterval(interval);
		currentlyPlaying = null;
	}
});

onMount(() => {
	interval = setInterval(fetchPlayer, 5000);
	fetchPlayer();

	function fetchPlayer() {
		fetch(`/api/play?uuid=${uuid}`, {
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		})
			.then((res) => res.json())
			.then((json) => {
				if ("message" in json) {
					currentlyPlaying = null;
				} else {
					currentlyPlaying = json;
				}
			})
			.catch(() => {
				currentlyPlaying = null;
			});
	}
});

let name = $state("");
let artist = $state("");
let image = $state("");
let isPlaying = $state(false);

const formatter = new Intl.ListFormat(navigator.language, {
  style: "long",
  type: "disjunction",
});

$effect(() => {
	isPlaying = currentlyPlaying !== null;
	if (currentlyPlaying) {
		name = currentlyPlaying.name;
		artist = formatter.format(currentlyPlaying.artists);
		image = currentlyPlaying.artworkUrl;
	}
});

let nameElement = $state(0);
let container = $state(0);
const slide = $derived(nameElement > container);
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

            <div class="font-bold text-xl text-white whitespace-nowrap"
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
