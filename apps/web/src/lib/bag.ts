import { useSyncExternalStore } from "react";

import type { Product } from "./catalog";

export interface BagItem {
	color: string;
	currencyCode: string;
	id: string;
	image: string;
	key: string;
	name: string;
	price: number;
	quantity: number;
	size: string;
}

const STORAGE_KEY = "ocdly.bag.v2";
const emptyBag: BagItem[] = [];
let items: BagItem[] = emptyBag;
let hydrated = false;
const listeners = new Set<() => void>();

function createItem(product: Product, size: string, quantity: number): BagItem {
	return {
		color: product.color,
		currencyCode: product.currencyCode,
		id: product.id,
		image: product.image,
		key: `${product.id}__${size}`,
		name: product.name,
		price: product.price,
		quantity,
		size,
	};
}

export function parseBag(raw: string | null): BagItem[] {
	try {
		const parsed: unknown = JSON.parse(raw ?? "[]");
		if (!Array.isArray(parsed)) {
			return [];
		}
		const valid = new Map<string, BagItem>();
		for (const value of parsed) {
			if (typeof value !== "object" || value === null) {
				continue;
			}
			if (
				typeof value.id !== "string" ||
				typeof value.name !== "string" ||
				typeof value.color !== "string" ||
				typeof value.image !== "string" ||
				typeof value.currencyCode !== "string" ||
				typeof value.size !== "string" ||
				typeof value.price !== "number" ||
				!Number.isFinite(value.price) ||
				value.price < 0 ||
				!Number.isInteger(value.quantity) ||
				value.quantity < 1
			) {
				continue;
			}
			const item: BagItem = {
				color: value.color,
				currencyCode: value.currencyCode,
				id: value.id,
				image: value.image,
				key: `${value.id}__${value.size}`,
				name: value.name,
				price: value.price,
				quantity: Math.min(value.quantity, 10),
				size: value.size,
			};
			valid.set(item.key, item);
		}
		return [...valid.values()];
	} catch {
		return [];
	}
}

function ensureHydrated() {
	if (hydrated || typeof window === "undefined") {
		return;
	}
	hydrated = true;
	try {
		items = parseBag(localStorage.getItem(STORAGE_KEY));
	} catch {
		items = emptyBag;
	}
}

function emit() {
	for (const listener of listeners) {
		listener();
	}
}

function persist() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	} catch {
		emit();
		return;
	}
	emit();
}

function handleStorage(event: StorageEvent) {
	if (event.key === STORAGE_KEY || event.key === null) {
		items = parseBag(event.newValue);
		emit();
	}
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	if (listeners.size === 1) {
		window.addEventListener("storage", handleStorage);
	}
	return () => {
		listeners.delete(listener);
		if (listeners.size === 0) {
			window.removeEventListener("storage", handleStorage);
		}
	};
}

function getItems() {
	ensureHydrated();
	return items;
}

function getServerItems() {
	return emptyBag;
}

export function addToBag(product: Product, size: string) {
	if (!product.sizes.includes(size)) {
		return;
	}
	ensureHydrated();
	const key = `${product.id}__${size}`;
	const existing = items.find((item) => item.key === key);
	items = existing
		? items.map((item) =>
				item.key === key
					? { ...item, quantity: Math.min(item.quantity + 1, 10) }
					: item
			)
		: [...items, createItem(product, size, 1)];
	persist();
}

export function setQuantity(key: string, quantity: number) {
	if (!Number.isInteger(quantity)) {
		return;
	}
	ensureHydrated();
	items =
		quantity < 1
			? items.filter((item) => item.key !== key)
			: items.map((item) =>
					item.key === key
						? { ...item, quantity: Math.min(quantity, 10) }
						: item
				);
	persist();
}

export function removeFromBag(key: string) {
	ensureHydrated();
	items = items.filter((item) => item.key !== key);
	persist();
}

export function useBag() {
	return useSyncExternalStore(subscribe, getItems, getServerItems);
}
