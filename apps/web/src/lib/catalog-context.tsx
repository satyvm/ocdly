import { createContext, type ReactNode, useContext } from "react";

import type { Product } from "./catalog";

const CatalogContext = createContext<readonly Product[] | null>(null);

export function CatalogProvider({
	children,
	products,
}: {
	children: ReactNode;
	products: readonly Product[];
}) {
	return (
		<CatalogContext.Provider value={products}>
			{children}
		</CatalogContext.Provider>
	);
}

export function useCatalog() {
	const products = useContext(CatalogContext);
	if (!products) {
		throw new Error("useCatalog must be used within CatalogProvider");
	}
	return products;
}
