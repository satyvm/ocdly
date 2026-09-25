import type { Session } from "@ocdly/auth";
import type { Database } from "@ocdly/db";

export type Context = {
  session: Session | null;
  db: Database;
};
