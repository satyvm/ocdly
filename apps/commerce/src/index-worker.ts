import { bootstrapWorker } from "@vendure/core";
import { config } from "./vendure-config";

bootstrapWorker(config)
	.then((worker) => worker.startJobQueue())
	.catch((error: unknown) => {
		console.error(error);
		process.exitCode = 1;
	});
