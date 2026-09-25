import { ENV } from "../env";

export async function linkCommerceCustomer(): Promise<void> {
	const response = await fetch(
		new URL("/api/commerce/customer", ENV.VITE_SERVER_URL),
		{ credentials: "include", method: "POST" }
	);
	if (!response.ok) {
		throw new Error("Could not connect your commerce account");
	}
}
