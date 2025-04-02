<script lang="ts">
import { page } from "$app/state";
import Song from "$lib/components/Song.svelte";
</script>

<Song uuid={page.params.uuid}/>