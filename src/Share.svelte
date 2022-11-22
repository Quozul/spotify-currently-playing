<script lang="ts">
    import {token} from "./store/store";

	function copy() {
		navigator.clipboard.writeText(`${window.location.origin}/#${$token.refresh_token}`);
    }

	function logout() {
		$token = null;
		window.location.hash = "";
		window.location.search = "";
    }
</script>

<div class="flex gap-2 justify-center">
    <button on:click={copy}>Copy</button>
    <button on:click={logout}>Logout</button>
</div>