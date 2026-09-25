import { createAxiomDrain } from "evlog/axiom";
import { definePlugin as defineNitroPlugin } from "nitro";

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("evlog:drain", createAxiomDrain());
});
