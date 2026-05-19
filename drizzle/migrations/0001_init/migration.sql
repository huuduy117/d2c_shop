-- Initial schema migration for Phase 0
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text,
  role text NOT NULL DEFAULT 'buyer',
  full_name text,
  phone text,
  avatar_url text,
  is_active boolean DEFAULT true,
  pdpa_consented_at timestamptz,
  pdpa_version text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name text NOT NULL,
  logo_url text,
  contact_email text,
  contact_phone text,
  tax_code text,
  bank_account text,
  bank_name text,
  bank_owner_name text,
  social_links jsonb,
  vat_invoice_provider text,
  vat_invoice_config jsonb,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  ward text,
  district text NOT NULL,
  city text NOT NULL,
  latitude numeric(10,7),
  longitude numeric(10,7),
  phone text,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  ghn_shop_id text,
  created_at timestamptz DEFAULT now()
);
