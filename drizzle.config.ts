import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const drizzleConfig = {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL ?? "",
  },
};

export default drizzleConfig;
