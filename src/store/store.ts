import type {Writable} from "svelte/store";
import {createStoreEntry} from "./helper";

export type Token = {
	access_token: string,
	expires_in: number,
	refresh_token: string,
	scope: string,
	token_type: string,
	expires_at?: number,
	error?: string,
}

export const token: Writable<Token | null> = createStoreEntry("token", null, localStorage);