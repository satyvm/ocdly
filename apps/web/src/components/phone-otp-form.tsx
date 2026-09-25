import { Button } from "@ocdly/ui/components/button";
import { Input } from "@ocdly/ui/components/input";
import { Label } from "@ocdly/ui/components/label";
import { useNavigate } from "@tanstack/react-router";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { linkCommerceCustomer } from "@/lib/commerce-identity";

type Step = "phone" | "code";
const INDIAN_PHONE_PATTERN = /^[6-9]\d{9}$/;
const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;
const OTP_PATTERN = /^\d{6}$/;
const NON_DIGIT_PATTERN = /\D/g;
const PHONE_SEPARATOR_PATTERN = /[\s()-]/g;

function normalizeIndianPhone(value: string) {
	const compact = value.replace(PHONE_SEPARATOR_PATTERN, "");
	if (INDIAN_PHONE_PATTERN.test(compact)) {
		return `+91${compact}`;
	}
	return compact;
}

function isE164Phone(value: string) {
	return E164_PHONE_PATTERN.test(value);
}

function getSubmitLabel(step: Step, isSubmitting: boolean) {
	if (isSubmitting) {
		return "Please wait…";
	}
	return step === "phone" ? "Send verification code" : "Verify and continue";
}

export default function PhoneOtpForm() {
	const navigate = useNavigate();
	const [step, setStep] = useState<Step>("phone");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [code, setCode] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const normalizedPhone = normalizeIndianPhone(phoneNumber);

	const sendOtp = useCallback(async () => {
		if (!isE164Phone(normalizedPhone)) {
			toast.error("Enter a valid 10-digit Indian number or an E.164 number.");
			return;
		}

		setIsSubmitting(true);
		const result = await authClient.phoneNumber.sendOtp({
			phoneNumber: normalizedPhone,
		});
		setIsSubmitting(false);

		if (result.error) {
			toast.error(result.error.message ?? "We could not send the code.");
			return;
		}

		setPhoneNumber(normalizedPhone);
		setStep("code");
		toast.success("Verification code sent.");
	}, [normalizedPhone]);

	const verifyOtp = useCallback(async () => {
		if (!OTP_PATTERN.test(code)) {
			toast.error("Enter the 6-digit verification code.");
			return;
		}

		setIsSubmitting(true);
		const result = await authClient.phoneNumber.verify({
			code,
			phoneNumber: normalizedPhone,
		});
		setIsSubmitting(false);

		if (result.error) {
			toast.error(result.error.message ?? "That code could not be verified.");
			return;
		}

		try {
			await linkCommerceCustomer();
			toast.success("Welcome to ocdly.");
		} catch {
			toast.error("Signed in, but your shop account could not connect yet.");
		}
		await navigate({ to: "/account" });
	}, [code, navigate, normalizedPhone]);

	const handleSubmit = useCallback(
		async (event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (step === "phone") {
				await sendOtp();
				return;
			}
			await verifyOtp();
		},
		[sendOtp, step, verifyOtp]
	);

	const handlePhoneChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			setPhoneNumber(event.target.value);
		},
		[]
	);

	const handleCodeChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			setCode(event.target.value.replace(NON_DIGIT_PATTERN, ""));
		},
		[]
	);

	const changeNumber = useCallback(() => {
		setStep("phone");
	}, []);

	const resendOtp = useCallback(async () => {
		await sendOtp();
	}, [sendOtp]);

	return (
		<section className="mx-auto mt-10 w-full max-w-md p-6">
			<p className="mb-2 text-center text-sm uppercase tracking-[0.2em]">
				ocdly account
			</p>
			<h1 className="mb-3 text-center font-bold text-3xl">
				{step === "phone" ? "Continue with your phone" : "Enter your code"}
			</h1>
			<p className="mb-8 text-center text-muted-foreground text-sm">
				{step === "phone"
					? "We’ll send a short-lived verification code on WhatsApp. No password needed."
					: `We sent a 6-digit code to ${normalizedPhone}.`}
			</p>

			<form className="space-y-4" onSubmit={handleSubmit}>
				{step === "phone" ? (
					<div className="space-y-2">
						<Label htmlFor="phone-number">Phone number</Label>
						<Input
							autoComplete="tel"
							id="phone-number"
							inputMode="tel"
							onChange={handlePhoneChange}
							placeholder="98765 43210"
							required
							value={phoneNumber}
						/>
						<p className="text-muted-foreground text-xs">
							Indian numbers default to +91. Other numbers must include the
							country code.
						</p>
					</div>
				) : (
					<div className="space-y-2">
						<Label htmlFor="verification-code">Verification code</Label>
						<Input
							autoComplete="one-time-code"
							id="verification-code"
							inputMode="numeric"
							maxLength={6}
							onChange={handleCodeChange}
							pattern="[0-9]{6}"
							placeholder="000000"
							required
							value={code}
						/>
					</div>
				)}

				<Button className="w-full" disabled={isSubmitting} type="submit">
					{getSubmitLabel(step, isSubmitting)}
				</Button>
			</form>

			{step === "code" ? (
				<div className="mt-4 flex justify-center gap-2">
					<Button onClick={changeNumber} type="button" variant="link">
						Change number
					</Button>
					<Button
						disabled={isSubmitting}
						onClick={resendOtp}
						type="button"
						variant="link"
					>
						Send again
					</Button>
				</div>
			) : null}
		</section>
	);
}
