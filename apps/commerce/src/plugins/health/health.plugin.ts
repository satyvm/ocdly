import { Controller, Get, Redirect } from "@nestjs/common";
import { VendurePlugin } from "@vendure/core";

@Controller("health")
class HealthController {
	@Get()
	check() {
		return { service: "ocdly-commerce", status: "ok" };
	}
}

@Controller()
class DashboardRedirectController {
	@Get()
	@Redirect("/dashboard/", 302)
	openDashboard() {
		// NestJS sends the redirect declared above.
	}
}

@VendurePlugin({ controllers: [HealthController, DashboardRedirectController] })
export class HealthPlugin {}
