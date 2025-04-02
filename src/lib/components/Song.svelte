<script lang="ts">
import { onMount } from "svelte";
const { uuid } = $props();

let currentlyPlaying = $state<any>(null);
let interval = $state<number | null>(null);

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
				currentlyPlaying = json;
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

$effect(() => {
	if (currentlyPlaying) {
		name = currentlyPlaying.item.name;
		artist = currentlyPlaying.item.artists[0].name;
		image = currentlyPlaying.item.album.images[0].url;
		isPlaying = currentlyPlaying.is_playing;
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
