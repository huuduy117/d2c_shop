import dotenv from "dotenv";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : false,
});

async function main() {
  try {
    console.log("📝 Reading migration SQL...");
    const migrationPath = join(
      process.cwd(),
      "drizzle/migrations/0002_phase1/migration.sql",
    );
    const sql = readFileSync(migrationPath, "utf-8");

    console.log("🚀 Applying migration...");
    await pool.query(sql);

    console.log("✅ Migration applied successfully!");
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
