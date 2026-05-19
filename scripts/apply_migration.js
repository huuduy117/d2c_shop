// Simple migration runner: applies SQL from drizzle/migrations/0001_init/migration.sql
// Loads .env.local and executes statements sequentially.
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

try {
  require("dotenv").config({ path: ".env.local" });
} catch {}

async function main() {
  const sqlPath = path.join(
    __dirname,
    "..",
    "drizzle",
    "migrations",
    "0001_init",
    "migration.sql",
  );
  if (!fs.existsSync(sqlPath)) {
    console.error("Migration file not found:", sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    // Naive split by semicolon; skip empty statements
    const statements = sql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      console.log(
        "Executing statement...\n",
        stmt.slice(0, 120),
        stmt.length > 120 ? "..." : "",
      );
      await pool.query(stmt);
    }
    console.log("Migration applied successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
