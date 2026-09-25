import { type RuntimeVendureConfig, VendurePlugin } from "@vendure/core";
import {
	BetterAuthCustomerStrategy,
	type BetterAuthCustomerStrategyOptions,
} from "./better-auth-customer.strategy";

export function createBetterAuthCustomerPlugin(
	options: BetterAuthCustomerStrategyOptions
) {
	@VendurePlugin({
		compatibility: "^3.7.0",
		configuration: (config: RuntimeVendureConfig) => {
			const strategy = new BetterAuthCustomerStrategy(options);
			config.authOptions.shopAuthenticationStrategy = [strategy];
			return config;
		},
	})
	class BetterAuthCustomerPlugin {}

	return BetterAuthCustomerPlugin;
}
