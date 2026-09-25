import { spawn } from "bun";

const args = process.argv.slice(2);
const hasPort = args.some(
	(argument) => argument === "--port" || argument.startsWith("--port=")
);

const child = spawn(
	[
		process.execPath,
		"run",
		"dev:bare",
		"--",
		"--host",
		"0.0.0.0",
		"--strictPort",
		...(hasPort ? [] : ["--port", process.env.PORT ?? "4317"]),
		...args,
	],
	{
		cwd: `${import.meta.dir}/..`,
		env: {
			...process.env,
			VITE_SERVER_URL: process.env.VITE_SERVER_URL ?? "http://127.0.0.1:3000",
		},
		stderr: "inherit",
		stdin: "inherit",
		stdout: "inherit",
	}
);

process.exit(await child.exited);
