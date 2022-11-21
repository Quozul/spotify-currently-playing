import type { Writable } from "svelte/store";
import { writable } from "svelte/store";

export function createStoreEntry<T>(
	name: string,
	defaultValue: T | null = null,
	storage: Storage | false = false
): Writable<T> {
	const storageValue = (storage && storage.getItem(name)) || null;
	const value = storageValue ? JSON.parse(storageValue) : defaultValue;
	const token = writable(value);

	token.subscribe((val) => {
		if (storage && val !== undefined) {
			return (storage[name] = JSON.stringify(val));
		}
	});

	return token;
}