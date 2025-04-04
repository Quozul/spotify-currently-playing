<script lang="ts">
import { onDestroy, onMount } from "svelte";
import SlideText from "$lib/components/SlideText.svelte";

const { uuid } = $props();

type CurrentSong = {
	artworkUrl: string;
	name: string;
	artists: string;
	isPlaying: boolean;
	progress: number;
	duration: number;
};

let currentlyPlaying = $state<CurrentSong | null>(null);
let interval = $state<NodeJS.Timeout | null>(null);

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

$effect(() => {
	if (currentlyPlaying) {
		const formatter = new Intl.ListFormat(navigator.language, {
			style: "long",
			type: "conjunction",
		});

		name = currentlyPlaying.name;
		artist = formatter.format(currentlyPlaying.artists);
		image = currentlyPlaying.artworkUrl;
		isPlaying = currentlyPlaying.isPlaying;
	}
});
</script>

<style>
    .container {
        width: 0;
        height: 70px;
        opacity: 0;
    }

    .active {
        width: 350px;
        opacity: 1;
    }

    .img {
        width: 70px;
        height: 70px;
        z-index: 100;
    }
</style>

<div class="shadow-black/50 shadow-xl rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 container transition-all duration-500"
     class:active={isPlaying}>
    <div class="flex">
        <img src="{image}" alt="artwork" class="img rounded-xl"/>

        <div class="flex-grow p-2 overflow-hidden">
            <div class="bg-gradient-to-r from-purple-800 to-red-800 bg-clip-text text-transparent font-black uppercase truncate">
                {artist}
            </div>

            <div class="font-bold text-xl overflow-hidden text-white">
                <SlideText>
                    {name}
                </SlideText>
            </div>
        </div>
    </div>
</div>
