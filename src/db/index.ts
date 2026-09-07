import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dbPath = (process.env.DATABASE_URL ?? "file:./local.db").replace(/^file:/, "");

function connect() {
  const sqlite = new Database(dbPath);

  sqlite.pragma("busy_timeout = 5000");

  sqlite.pragma("journal_mode = WAL");

  sqlite.pragma("foreign_keys = ON");

  return drizzle(sqlite, { schema });
}

let instance: ReturnType<typeof connect> | null = null;

export const db = new Proxy({} as ReturnType<typeof connect>, {
  get(_target, prop, receiver) {
    instance ??= connect();
    return Reflect.get(instance, prop, receiver);
  },
});
