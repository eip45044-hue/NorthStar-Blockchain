import type { Pool } from "pg";

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS "wallet_profiles" (
    "id" serial PRIMARY KEY NOT NULL,
    "clerk_user_id" text NOT NULL UNIQUE,
    "display_name" text NOT NULL,
    "email" text NOT NULL,
    "verification_status" text DEFAULT 'unverified' NOT NULL,
    "referral_code" text NOT NULL UNIQUE,
    "referral_invited_count" integer DEFAULT 0 NOT NULL,
    "referral_reward" numeric(18, 2) DEFAULT '0' NOT NULL,
    "totp_secret" text,
    "two_factor_enabled" boolean DEFAULT false NOT NULL,
    "sms_phone_number" text,
    "sms_phone_verified" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "wallet_holdings" (
    "id" serial PRIMARY KEY NOT NULL,
    "clerk_user_id" text NOT NULL,
    "symbol" text NOT NULL,
    "name" text NOT NULL,
    "amount" numeric(30, 12) NOT NULL,
    "value" numeric(18, 2) NOT NULL,
    "allocation" numeric(6, 2) NOT NULL,
    "change_24h" numeric(8, 2) NOT NULL,
    "color" text NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "wallet_activities" (
    "id" serial PRIMARY KEY NOT NULL,
    "clerk_user_id" text NOT NULL,
    "type" text NOT NULL,
    "asset" text NOT NULL,
    "amount" numeric(30, 12) NOT NULL,
    "value" numeric(18, 2) NOT NULL,
    "status" text NOT NULL,
    "transaction_id" integer,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "kyc_submissions" (
    "id" serial PRIMARY KEY NOT NULL,
    "clerk_user_id" text NOT NULL,
    "full_name" text NOT NULL,
    "country" text NOT NULL,
    "city" text DEFAULT '' NOT NULL,
    "occupation" text DEFAULT '' NOT NULL,
    "ssn" text DEFAULT '' NOT NULL,
    "document_type" text NOT NULL,
    "document_image_base64" text,
    "status" text DEFAULT 'pending' NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "wallet_transactions" (
    "id" serial PRIMARY KEY NOT NULL,
    "clerk_user_id" text NOT NULL,
    "type" text NOT NULL,
    "asset" text NOT NULL,
    "amount" numeric(30, 12) NOT NULL,
    "destination" text,
    "tx_hash" text,
    "proof_path" text,
    "status" text DEFAULT 'pending' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "support_threads" (
    "id" serial PRIMARY KEY NOT NULL,
    "clerk_user_id" text NOT NULL UNIQUE,
    "status" text DEFAULT 'open' NOT NULL,
    "admin_last_read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "support_messages" (
    "id" serial PRIMARY KEY NOT NULL,
    "thread_id" integer NOT NULL,
    "sender_role" text NOT NULL,
    "content" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "trades" (
    "id" serial PRIMARY KEY NOT NULL,
    "clerk_user_id" text NOT NULL,
    "asset" text NOT NULL,
    "direction" text NOT NULL,
    "amount" numeric(20, 8) NOT NULL,
    "timeframe_secs" integer NOT NULL,
    "status" text DEFAULT 'active' NOT NULL,
    "result" text,
    "admin_override" text,
    "entry_price" numeric(20, 8) NOT NULL,
    "exit_price" numeric(20, 8),
    "payout" numeric(20, 8),
    "payout_rate" numeric(5, 4) DEFAULT '0.85' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "settled_at" timestamp with time zone
  )`,
  `CREATE TABLE IF NOT EXISTS "trading_accounts" (
    "id" serial PRIMARY KEY NOT NULL,
    "clerk_user_id" text NOT NULL UNIQUE,
    "balance" numeric(20, 8) DEFAULT '0' NOT NULL,
    "total_trades" integer DEFAULT 0 NOT NULL,
    "wins" integer DEFAULT 0 NOT NULL,
    "losses" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "user_passkeys" (
    "id" serial PRIMARY KEY NOT NULL,
    "clerk_user_id" text NOT NULL,
    "credential_id" text NOT NULL UNIQUE,
    "public_key" text NOT NULL,
    "device_name" text DEFAULT 'Passkey' NOT NULL,
    "transports" text,
    "counter" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
];

export async function ensureSchema(pool: Pick<Pool, "query">) {
  for (const statement of schemaStatements) {
    await pool.query(statement);
  }
}