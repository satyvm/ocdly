import { createHmac } from "node:crypto";
import {
	type AuthenticationStrategy,
	CustomerService,
	ExternalAuthenticationService,
	type Injector,
	type RequestContext,
	type User,
} from "@vendure/core";
import gql from "graphql-tag";
import {
	type BetterAuthIdentityClaims,
	type IdentityAssertionVerifierOptions,
	verifyBetterAuthIdentityAssertion,
} from "./better-auth-identity-assertion";

export const BETTER_AUTH_STRATEGY_NAME = "better_auth";
const NAME_SEPARATOR = /\s+/;

export interface BetterAuthAuthenticationData {
	assertion: string;
}

export interface BetterAuthCustomerStrategyOptions
	extends IdentityAssertionVerifierOptions {
	strategyName?: string;
	syntheticEmailDomain?: string;
}

type CustomerAuthenticationService = Pick<
	ExternalAuthenticationService,
	"createCustomerAndUser" | "findCustomerUser"
>;
type LinkedCustomerService = Pick<
	CustomerService,
	"findOneByUserId" | "update"
>;

function customerName(claims: BetterAuthIdentityClaims) {
	if (claims.given_name || claims.family_name) {
		return {
			firstName: claims.given_name ?? "ocdly",
			lastName: claims.family_name ?? "",
		};
	}

	const [firstName, ...remaining] = claims.name?.split(NAME_SEPARATOR) ?? [];
	return {
		firstName: firstName || "ocdly",
		lastName: remaining.join(" "),
	};
}

function customerEmail(
	claims: BetterAuthIdentityClaims,
	syntheticEmailDomain: string,
	secret: string | Buffer
) {
	if (claims.email && claims.email_verified === true) {
		return { emailAddress: claims.email.toLowerCase(), verified: true };
	}

	const identityHash = createHmac("sha256", secret)
		.update(claims.sub)
		.digest("hex")
		.slice(0, 40);
	return {
		emailAddress: `${identityHash}@${syntheticEmailDomain}`,
		verified: true,
	};
}

export class BetterAuthCustomerStrategy
	implements AuthenticationStrategy<BetterAuthAuthenticationData>
{
	readonly name: string;
	private externalAuthenticationService?: CustomerAuthenticationService;
	private customerService?: LinkedCustomerService;
	private readonly options: BetterAuthCustomerStrategyOptions;

	constructor(
		options: BetterAuthCustomerStrategyOptions,
		externalAuthenticationService?: CustomerAuthenticationService,
		customerService?: LinkedCustomerService
	) {
		this.options = options;
		this.name = options.strategyName ?? BETTER_AUTH_STRATEGY_NAME;
		this.externalAuthenticationService = externalAuthenticationService;
		this.customerService = customerService;
	}

	init(injector: Injector) {
		this.externalAuthenticationService = injector.get(
			ExternalAuthenticationService
		);
		this.customerService = injector.get(CustomerService);
	}

	defineInputType() {
		return gql`
			input BetterAuthIdentityAssertionInput {
				assertion: String!
			}
		`;
	}

	async authenticate(
		ctx: RequestContext,
		data: BetterAuthAuthenticationData
	): Promise<User | false> {
		if (!(this.externalAuthenticationService && this.customerService)) {
			throw new Error("BetterAuthCustomerStrategy has not been initialized");
		}

		let claims: BetterAuthIdentityClaims;
		try {
			claims = verifyBetterAuthIdentityAssertion(data.assertion, this.options);
		} catch {
			return false;
		}

		const existingUser =
			await this.externalAuthenticationService.findCustomerUser(
				ctx,
				this.name,
				claims.sub
			);
		let user = existingUser;
		if (!user) {
			const email = customerEmail(
				claims,
				this.options.syntheticEmailDomain ?? "customers.ocdly.invalid",
				this.options.secret
			);
			user = await this.externalAuthenticationService.createCustomerAndUser(
				ctx,
				{
					...customerName(claims),
					emailAddress: email.emailAddress,
					externalIdentifier: claims.sub,
					strategy: this.name,
					// The HMAC address cannot be pre-registered by another shopper.
					verified: email.verified,
				}
			);
		}

		const customer = await this.customerService.findOneByUserId(ctx, user.id);
		if (!customer) {
			throw new Error("Vendure customer was not found for the linked user");
		}
		if (customer.phoneNumber !== claims.phone_number) {
			await this.customerService.update(ctx, {
				id: customer.id,
				phoneNumber: claims.phone_number,
			});
		}
		return user;
	}
}
