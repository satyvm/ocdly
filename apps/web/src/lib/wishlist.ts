import { useSyncExternalStore } from "react";

const key = "ocdly.wishlist.v1";
const empty: string[] = [];
let items = empty;
let hydrated = false;
const listeners = new Set<() => void>();

export function parseWishlist(raw: string | null): string[] {
	try {
		const value: unknown = JSON.parse(raw ?? "[]");
		if (!Array.isArray(value)) {
			return [];
		}
		return [
			...new Set(
				value.filter(
					(id): id is string => typeof id === "string" && id.length > 0
				)
			),
		];
	} catch {
		return [];
	}
}
function emit() {
	for (const listener of listeners) {
		listener();
	}
}
function hydrate() {
	if (hydrated || typeof window === "undefined") {
		return;
	}
	hydrated = true;
	try {
		items = parseWishlist(localStorage.getItem(key));
	} catch {
		items = empty;
	}
}
function onStorage(event: StorageEvent) {
	if (event.key === key || event.key === null) {
		items = parseWishlist(event.newValue);
		emit();
	}
}
function subscribe(listener: () => void) {
	listeners.add(listener);
	if (listeners.size === 1) {
		window.addEventListener("storage", onStorage);
	}
	return () => {
		listeners.delete(listener);
		if (listeners.size === 0) {
			window.removeEventListener("storage", onStorage);
		}
	};
}
function getSnapshot() {
	hydrate();
	return items;
}
function getServerSnapshot() {
	return empty;
}
export function useWishlist() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
export function toggleSaved(id: string) {
	if (!id) {
		return;
	}
	hydrate();
	items = items.includes(id)
		? items.filter((item) => item !== id)
		: [...items, id];
	try {
		localStorage.setItem(key, JSON.stringify(items));
	} catch {
		emit();
		return;
	}
	emit();
}
