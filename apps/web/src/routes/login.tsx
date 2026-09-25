import { Button } from "@ocdly/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import PhoneOtpForm from "@/components/phone-otp-form";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
});

function RouteComponent() {
	const [useEmail, setUseEmail] = useState(false);
	const [showSignIn, setShowSignIn] = useState(false);

	const switchToSignUp = useCallback(() => {
		setShowSignIn(false);
	}, []);

	const switchToSignIn = useCallback(() => {
		setShowSignIn(true);
	}, []);

	const toggleLoginMethod = useCallback(() => {
		setUseEmail((value) => !value);
	}, []);

	let loginForm = <PhoneOtpForm />;
	if (useEmail) {
		loginForm = showSignIn ? (
			<SignInForm onSwitchToSignUp={switchToSignUp} />
		) : (
			<SignUpForm onSwitchToSignIn={switchToSignIn} />
		);
	}

	return (
		<main id="main-content">
			{loginForm}
			<div className="text-center">
				<Button onClick={toggleLoginMethod} type="button" variant="link">
					{useEmail ? "Use phone instead" : "Use email instead"}
				</Button>
			</div>
		</main>
	);
}
