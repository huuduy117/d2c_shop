import dotenv from "dotenv";
import { Pool } from "pg";
import { hashPassword } from "../src/lib/utils/hash";

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
  const adminEmail = process.env.ADMIN_SEED_EMAIL ?? "admin@d2c.local";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? "Admin123!";

  const existingAdmin = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [adminEmail.toLowerCase()],
  );
  if (existingAdmin.rowCount === 0) {
    const hashed = await hashPassword(adminPassword);
    await pool.query(
      `INSERT INTO users (email, password_hash, role, full_name, phone, pdpa_consented_at, pdpa_version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        adminEmail.toLowerCase(),
        hashed,
        "admin",
        "Admin",
        "0000000000",
        new Date(),
        process.env.PDPA_VERSION ?? "v1.0-2026-05-18",
      ],
    );
    console.log("Seeded admin user", adminEmail);
  } else {
    console.log("Admin already exists", adminEmail);
  }

  const existingShop = await pool.query("SELECT id FROM shop_config LIMIT 1");
  if (existingShop.rowCount === 0) {
    await pool.query(
      `INSERT INTO shop_config (id, shop_name, contact_email, contact_phone, tax_code, bank_account, bank_name, bank_owner_name, social_links, vat_invoice_provider, vat_invoice_config, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        "D2C Shop",
        "hello@d2c.local",
        "0900000000",
        "",
        "",
        "",
        "",
        JSON.stringify({ facebook: "", instagram: "", tiktok: "" }),
        "vnpt",
        JSON.stringify({}),
      ],
    );
    console.log("Seeded shop configuration");
  } else {
    console.log("Shop configuration already exists");
  }

  const existingBranch = await pool.query(
    "SELECT id FROM branches WHERE name = $1",
    ["Chi nhánh chính"],
  );
  if (existingBranch.rowCount === 0) {
    await pool.query(
      `INSERT INTO branches (name, address, ward, district, city, phone, is_active, is_default, latitude, longitude, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        "Chi nhánh chính",
        "123 Đường Chính",
        "Phường 1",
        "Quận 1",
        "Hà Nội",
        "0900000000",
        true,
        true,
        21.028511,
        105.804817,
      ],
    );
    console.log("Seeded default branch");
  } else {
    console.log("Default branch already exists");
  }

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
