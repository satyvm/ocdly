CREATE TABLE "rateLimit" (
	"count" integer NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"lastRequest" bigint NOT NULL,
	CONSTRAINT "rateLimit_key_unique" UNIQUE("key")
);
