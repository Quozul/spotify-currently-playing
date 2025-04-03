<script lang="ts">
let containerWidth = $state(0);
let elementWidth = $state(0);
const shouldSlide = $derived(containerWidth < elementWidth);
let { children } = $props();
</script>

<style>
    .slide {
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

<div class="whitespace-nowrap fade"
    class:slide={shouldSlide}
    style="--width: {containerWidth - elementWidth}px;" bind:clientWidth={containerWidth}>
    <div class="inline-block" bind:clientWidth={elementWidth}>
        {@render children()}
    </div>
</div>