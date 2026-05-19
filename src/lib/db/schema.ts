import { sql } from "drizzle-orm";
import {
  boolean,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").default(sql`gen_random_uuid()`),
    email: text("email").notNull(),
    password_hash: text("password_hash"),
    role: text("role").notNull().default("buyer"),
    full_name: text("full_name"),
    phone: text("phone"),
    avatar_url: text("avatar_url"),
    is_active: boolean("is_active").default(true),
    pdpa_consented_at: timestamp("pdpa_consented_at", { withTimezone: true }),
    pdpa_version: text("pdpa_version"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  }),
);

export const shopConfig = pgTable("shop_config", {
  id: uuid("id").default(sql`gen_random_uuid()`),
  shop_name: text("shop_name").notNull(),
  logo_url: text("logo_url"),
  contact_email: text("contact_email"),
  contact_phone: text("contact_phone"),
  tax_code: text("tax_code"),
  bank_account: text("bank_account"),
  bank_name: text("bank_name"),
  bank_owner_name: text("bank_owner_name"),
  social_links: jsonb("social_links"),
  vat_invoice_provider: text("vat_invoice_provider"),
  vat_invoice_config: jsonb("vat_invoice_config"),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const branches = pgTable("branches", {
  id: uuid("id").default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  ward: text("ward"),
  district: text("district").notNull(),
  city: text("city").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  phone: text("phone"),
  is_active: boolean("is_active").default(true),
  is_default: boolean("is_default").default(false),
  ghn_shop_id: text("ghn_shop_id"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
