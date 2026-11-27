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
  memoryCache = JSON.parse(raw) as LocalDbSchema;
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
