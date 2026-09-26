import { Toaster } from "@ocdly/ui/components/sonner";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { evlogErrorHandler } from "evlog/nitro/v3";

import appCss from "../index.css?url";

export const Route = createRootRoute({
	server: {
		middleware: [createMiddleware().server(evlogErrorHandler)],
	},
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "ocdly — New In" },
			{
				name: "description",
				content:
					"Discover ocdly New In: men's plain T-shirts and original printed tees, designed in India.",
			},
			{ name: "robots", content: "noindex, nofollow" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	component: RootDocument,
});

function RootDocument() {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<Outlet />
				<Toaster richColors />
				<Scripts />
			</body>
		</html>
	);
}
