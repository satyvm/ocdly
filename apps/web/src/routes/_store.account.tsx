import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Breadcrumb, PageHeading } from "@/components/storefront/page-parts";
import { authClient } from "@/lib/auth-client";
import { linkCommerceCustomer } from "@/lib/commerce-identity";

export const Route = createFileRoute("/_store/account")({
	head: () => ({ meta: [{ title: "Your world — ocdly" }] }),
	component: AccountPage,
});

const PHONE_MASK_PATTERN = /^(\+\d{2})\d+(\d{4})$/;

function maskPhone(phoneNumber: string) {
	return phoneNumber.replace(PHONE_MASK_PATTERN, "$1 •••••• $2");
}

function AccountPage() {
	const navigate = useNavigate();
	const [isConnecting, setIsConnecting] = useState(false);
	const { data: session, isPending } = authClient.useSession();
	const phoneNumber = (session?.user as { phoneNumber?: string } | undefined)
		?.phoneNumber;
	const signOut = useCallback(async () => {
		await authClient.signOut();
		await navigate({ to: "/" });
	}, [navigate]);
	const connectCommerce = useCallback(async () => {
		setIsConnecting(true);
		try {
			await linkCommerceCustomer();
			toast.success("Your shop account is connected.");
		} catch {
			toast.error("Could not connect your shop account. Try again later.");
		} finally {
			setIsConnecting(false);
		}
	}, []);

	return (
		<main className="store-page" id="main-content">
			<Breadcrumb name="Your account" />
			<div className="account-layout">
				<img
					alt="ocdly T-shirt launch campaign"
					height={941}
					src="/images/ocdly-hero.png"
					width={1672}
				/>
				<section>
					<PageHeading
						subtitle="A more personal connection."
						title={session ? "Welcome back." : "Your ocdly space."}
					/>
					{isPending ? <p aria-live="polite">Checking your account…</p> : null}
					{isPending || session ? null : (
						<>
							<p>
								Sign in with your phone to keep your account ready for
								addresses, orders and future saved looks.
							</p>
							<div className="account-links">
								<Link to="/login">
									Continue with phone <span>One-time code</span>
								</Link>
							</div>
						</>
					)}
					{session ? (
						<>
							<p>
								Signed in as{" "}
								{phoneNumber ? maskPhone(phoneNumber) : session.user.email}.
							</p>
							{phoneNumber ? (
								<button
									className="text-button"
									disabled={isConnecting}
									onClick={connectCommerce}
									type="button"
								>
									{isConnecting ? "Connecting…" : "Connect shop account"}
								</button>
							) : null}
							<div className="account-links">
								<Link to="/wishlist">
									Explore your wishlist <span>Saved pieces</span>
								</Link>
								<Link to="/bag">
									Return to your cart <span>Your selection</span>
								</Link>
								<Link params={{ slug: "contact" }} to="/pages/$slug">
									Need a little help? <span>Client services</span>
								</Link>
							</div>
							<button className="text-button" onClick={signOut} type="button">
								Sign out
							</button>
						</>
					) : null}
				</section>
			</div>
		</main>
	);
}
