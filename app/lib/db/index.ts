import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  // Don't throw at module-load time — many parts of the app build without DATABASE_URL
  // (e.g., static page generation). API routes that actually need DB will see this and
  // throw at request time via getDb().
  console.warn("[db] DATABASE_URL not set; getDb() will throw if called");
}

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;
  const u = process.env.DATABASE_URL;
  if (!u) throw new Error("DATABASE_URL not set");
  const sql = postgres(u, { max: 1 });
  _db = drizzle(sql, { schema });
  return _db;
}

export { schema };
