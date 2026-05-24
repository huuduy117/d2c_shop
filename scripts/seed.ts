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
  console.log("🌱 Starting seed...");

  // ── Admin User ─────────────────────────────────────────
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
        "0900000000",
        new Date(),
        process.env.PDPA_VERSION ?? "v1.0-2026-05-18",
      ],
    );
    console.log("✅ Seeded admin user:", adminEmail);
  } else {
    console.log("⏭️  Admin already exists:", adminEmail);
  }

  // ── Shop Config ────────────────────────────────────────
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
    console.log("✅ Seeded shop configuration");
  } else {
    console.log("⏭️  Shop configuration already exists");
  }

  // ── Branches ───────────────────────────────────────────
  const existingBranches = await pool.query("SELECT COUNT(*) as count FROM branches");
  const branchCount = parseInt(existingBranches.rows[0].count);

  if (branchCount === 0) {
    // Hà Nội
    await pool.query(
      `INSERT INTO branches (name, address, ward, district, city, phone, is_active, is_default, latitude, longitude, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        "Chi nhánh Hà Nội",
        "123 Đường Chính",
        "Phường 1",
        "Quận 1",
        "Hà Nội",
        "0900000001",
        true,
        true,
        21.028511,
        105.804817,
      ],
    );
    // HCM
    await pool.query(
      `INSERT INTO branches (name, address, ward, district, city, phone, is_active, is_default, latitude, longitude, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        "Chi nhánh TP.HCM",
        "456 Đường Phụ",
        "Phường 2",
        "Quận 1",
        "TP.HCM",
        "0900000002",
        true,
        false,
        10.776589,
        106.700981,
      ],
    );
    console.log("✅ Seeded 2 branches (Hà Nội + HCM)");
  } else {
    console.log(`⏭️  Branches already exist (${branchCount} found)`);
  }

  // ── Categories ─────────────────────────────────────────
  const existingCategories = await pool.query("SELECT COUNT(*) as count FROM categories");
  const categoryCount = parseInt(existingCategories.rows[0].count);

  if (categoryCount === 0) {
    const categories = [
      { name: "Thời trang", slug: "thoi-trang" },
      { name: "Điện tử", slug: "dien-tu" },
      { name: "Sách", slug: "sach" },
      { name: "Mỹ phẩm", slug: "my-pham" },
      { name: "Thể thao", slug: "the-thao" },
    ];

    for (const cat of categories) {
      await pool.query(
        `INSERT INTO categories (name, slug, sort_order, is_active)
         VALUES ($1, $2, $3, $4)`,
        [cat.name, cat.slug, 0, true],
      );
    }
    console.log("✅ Seeded 5 categories");
  } else {
    console.log(`⏭️  Categories already exist (${categoryCount} found)`);
  }

  // ── Products & Variants ────────────────────────────────
  const existingProducts = await pool.query("SELECT COUNT(*) as count FROM products");
  const productCount = parseInt(existingProducts.rows[0].count);

  if (productCount === 0) {
    const products = [
      {
        name: "Áo thun nam cơ bản",
        slug: "ao-thun-nam-co-ban",
        base_price: 150000,
        category_slug: "thoi-trang",
        variants: [
          { sku: "TSHIRT-M-BLK", attributes: { size: "M", color: "Đen" }, weight: 200 },
          { sku: "TSHIRT-L-BLK", attributes: { size: "L", color: "Đen" }, weight: 200 },
          { sku: "TSHIRT-M-WHT", attributes: { size: "M", color: "Trắng" }, weight: 200 },
        ],
      },
      {
        name: "Quần jean nam",
        slug: "quan-jean-nam",
        base_price: 350000,
        category_slug: "thoi-trang",
        variants: [
          { sku: "JEAN-30-BLU", attributes: { size: "30", color: "Xanh" }, weight: 500 },
          { sku: "JEAN-32-BLU", attributes: { size: "32", color: "Xanh" }, weight: 500 },
        ],
      },
      {
        name: "Tai nghe Bluetooth",
        slug: "tai-nghe-bluetooth",
        base_price: 450000,
        category_slug: "dien-tu",
        variants: [
          { sku: "HEADPHONE-BLK", attributes: { color: "Đen" }, weight: 150 },
          { sku: "HEADPHONE-WHT", attributes: { color: "Trắng" }, weight: 150 },
        ],
      },
      {
        name: "Sạc nhanh USB-C",
        slug: "sac-nhanh-usb-c",
        base_price: 120000,
        category_slug: "dien-tu",
        variants: [
          { sku: "CHARGER-30W", attributes: { power: "30W" }, weight: 100 },
          { sku: "CHARGER-65W", attributes: { power: "65W" }, weight: 120 },
        ],
      },
      {
        name: "Sách Lập trình Python",
        slug: "sach-lap-trinh-python",
        base_price: 250000,
        category_slug: "sach",
        variants: [
          { sku: "BOOK-PYTHON-V1", attributes: { edition: "Lần 1" }, weight: 600 },
        ],
      },
      {
        name: "Kem dưỡng da",
        slug: "kem-duong-da",
        base_price: 350000,
        category_slug: "my-pham",
        variants: [
          { sku: "CREAM-50ML", attributes: { size: "50ml" }, weight: 80 },
          { sku: "CREAM-100ML", attributes: { size: "100ml" }, weight: 150 },
        ],
      },
      {
        name: "Giày chạy bộ",
        slug: "giay-chay-bo",
        base_price: 1200000,
        category_slug: "the-thao",
        variants: [
          { sku: "SHOE-40-BLK", attributes: { size: "40", color: "Đen" }, weight: 400 },
          { sku: "SHOE-42-BLK", attributes: { size: "42", color: "Đen" }, weight: 400 },
          { sku: "SHOE-40-RED", attributes: { size: "40", color: "Đỏ" }, weight: 400 },
        ],
      },
      {
        name: "Áo khoác nam",
        slug: "ao-khoac-nam",
        base_price: 650000,
        category_slug: "thoi-trang",
        variants: [
          { sku: "JACKET-M-BLK", attributes: { size: "M", color: "Đen" }, weight: 800 },
          { sku: "JACKET-L-BLK", attributes: { size: "L", color: "Đen" }, weight: 800 },
        ],
      },
      {
        name: "Chuột máy tính",
        slug: "chuot-may-tinh",
        base_price: 180000,
        category_slug: "dien-tu",
        variants: [
          { sku: "MOUSE-WIRELESS", attributes: { type: "Không dây" }, weight: 100 },
        ],
      },
      {
        name: "Bàn phím cơ",
        slug: "ban-phim-co",
        base_price: 1500000,
        category_slug: "dien-tu",
        variants: [
          { sku: "KEYBOARD-RGB", attributes: { backlight: "RGB" }, weight: 1000 },
        ],
      },
    ];

    for (const prod of products) {
      // Get category ID
      const catResult = await pool.query(
        "SELECT id FROM categories WHERE slug = $1",
        [prod.category_slug],
      );
      const categoryId = catResult.rows[0]?.id;

      // Insert product
      const prodResult = await pool.query(
        `INSERT INTO products (name, slug, base_price, category_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id`,
        [prod.name, prod.slug, prod.base_price, categoryId, "active"],
      );
      const productId = prodResult.rows[0].id;

      // Insert variants
      for (const variant of prod.variants) {
        const varResult = await pool.query(
          `INSERT INTO product_variants (product_id, sku, attributes, weight_gram, is_active)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [productId, variant.sku, JSON.stringify(variant.attributes), variant.weight, true],
        );
        const variantId = varResult.rows[0].id;

        // Get branch IDs
        const branchesResult = await pool.query("SELECT id FROM branches WHERE is_active = true");
        const branches = branchesResult.rows;

        // Insert inventory for each branch
        for (const branch of branches) {
          await pool.query(
            `INSERT INTO inventory (product_variant_id, branch_id, stock, reserved_stock, low_stock_threshold)
             VALUES ($1, $2, $3, $4, $5)`,
            [variantId, branch.id, Math.floor(Math.random() * 100) + 20, 0, 5],
          );
        }
      }
    }
    console.log("✅ Seeded 10 products with variants and inventory");
  } else {
    console.log(`⏭️  Products already exist (${productCount} found)`);
  }

  // ── Vouchers ───────────────────────────────────────────
  const existingVouchers = await pool.query("SELECT COUNT(*) as count FROM vouchers");
  const voucherCount = parseInt(existingVouchers.rows[0].count);

  if (voucherCount === 0) {
    const vouchers = [
      {
        code: "WELCOME10",
        discount_type: "percent",
        value: 10,
        max_discount: 100000,
        min_order: 100000,
        usage_limit: 100,
        per_user_limit: 1,
      },
      {
        code: "SAVE50K",
        discount_type: "fixed",
        value: 50000,
        min_order: 500000,
        usage_limit: 50,
        per_user_limit: 1,
      },
      {
        code: "SUMMER20",
        discount_type: "percent",
        value: 20,
        max_discount: 200000,
        min_order: 300000,
        usage_limit: 200,
        per_user_limit: 2,
      },
    ];

    for (const voucher of vouchers) {
      await pool.query(
        `INSERT INTO vouchers (code, discount_type, value, max_discount, min_order, usage_limit, per_user_limit, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          voucher.code,
          voucher.discount_type,
          voucher.value,
          voucher.max_discount,
          voucher.min_order,
          voucher.usage_limit,
          voucher.per_user_limit,
          true,
        ],
      );
    }
    console.log("✅ Seeded 3 vouchers");
  } else {
    console.log(`⏭️  Vouchers already exist (${voucherCount} found)`);
  }

  console.log("✨ Seed completed!");
  await pool.end();
}

main().catch((error) => {
  console.error("❌ Seed error:", error);
  process.exit(1);
});
