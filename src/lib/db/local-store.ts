import fs from "fs";
import path from "path";
import { createInitialSeedData, type LocalDbSchema } from "./seed-data";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "gym-db.json");

let memoryCache: LocalDbSchema | null = null;

export function readLocalDb(): LocalDbSchema {
  if (memoryCache) {
    return memoryCache;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
    memoryCache = initial;
    return initial;
  }

  const raw = fs.readFileSync(DB_FILE, "utf-8");
  const parsed = JSON.parse(raw) as LocalDbSchema;
  // Auto-migrasi field baru Fase 2A pada file lokal lama
  if (!parsed.freezes) parsed.freezes = [];
  if (!parsed.products) parsed.products = [];
  if (!parsed.stock_movements) parsed.stock_movements = [];
  if (!parsed.transaction_items) parsed.transaction_items = [];
  if (!parsed.expenses) parsed.expenses = [];
  if (!parsed.promotions) parsed.promotions = [];
  if (!parsed.referrals) parsed.referrals = [];
  if (parsed.gym_settings.referral_enabled === undefined) {
    parsed.gym_settings.referral_enabled = true;
    parsed.gym_settings.referral_discount_amount = 50000;
    parsed.gym_settings.referral_reward_type = "days";
    parsed.gym_settings.referral_reward_value = 7;
  }
  for (const m of parsed.members) {
    if (!m.referral_code) {
      m.referral_code = `REF-${m.member_code.replace("GYM-", "")}`;
    }
    if (m.discount_balance === undefined) {
      m.discount_balance = 0;
    }
  }
  if (parsed.gym_settings.cashier_can_record_expense === undefined) {
    parsed.gym_settings.cashier_can_record_expense = true;
  }
  if (parsed.gym_settings.freeze_allowed === undefined) {
    parsed.gym_settings.freeze_allowed = true;
    parsed.gym_settings.freeze_min_days = 3;
    parsed.gym_settings.freeze_max_days = 30;
    parsed.gym_settings.freeze_max_days_per_period = 30;
    parsed.gym_settings.freeze_fee = 0;
  }
  memoryCache = parsed;
  return memoryCache;
}

export function writeLocalDb(db: LocalDbSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  memoryCache = db;
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

export function resetLocalDbCache(): void {
  memoryCache = null;
}
