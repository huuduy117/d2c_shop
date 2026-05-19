import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { branches, shopConfig, users } from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : false,
});

export const db = drizzle<{
  users: typeof users;
  shop_config: typeof shopConfig;
  branches: typeof branches;
}>(pool);

export { pool };
