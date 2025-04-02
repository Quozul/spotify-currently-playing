<script lang="ts">
import "../app.css";

let { children } = $props();
</script>

<div class="flex justify-center items-center min-w-screen min-h-screen">
{@render children()}
</div>
