import crypto from "crypto";
import { subDays, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { GYM_TIMEZONE, addDaysToDateStr } from "@/lib/domain/membership";
import type {
  ActivityLog,
  Checkin,
  GymSettings,
  Member,
  Membership,
  Package,
  Shift,
  StaffUser,
  Transaction,
} from "@/types/database";

export interface LocalDbSchema {
  gym_settings: GymSettings;
  users: StaffUser[];
  packages: Package[];
  members: Member[];
  memberships: Membership[];
  transactions: Transaction[];
  checkins: Checkin[];
  shifts: Shift[];
  activity_logs: ActivityLog[];
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const INDONESIAN_NAMES = [
  "Andi Pratama", "Budi Santoso", "Citra Lestari", "Dewi Anggraini", "Eko Saputra",
  "Fajar Nugroho", "Gita Permata", "Hadi Kusuma", "Indah Sari", "Joko Widodo",
  "Kartika Putri", "Lukman Hakim", "Maya Puspita", "Nanda Wijaya", "Oki Setiawan",
  "Putri Ayu", "Qori Rahman", "Rina Marlina", "Surya Darma", "Tari Wulandari",
  "Umar Bakri", "Vina Melinda", "Wahyu Hidayat", "Xena Kartika", "Yoga Pratama",
  "Zara Amalia", "Agus Salim", "Bella Saphira", "Candra Kirana", "Dimas Aditya",
  "Elsa Novita", "Feri Irawan", "Galih Rakasiwi", "Hana Pertiwi", "Ivan Gunawan",
  "Julia Perez", "Kevin Sanjaya", "Lia Amelia", "Miko Saputra", "Nina Zatulini",
  "Oscar Lawalata", "Pandu Winata", "Rafi Ahmad", "Salsaabila", "Taufik Hidayat",
  "Uci Sanusi", "Vera Zaneta", "Wawan Setiawan", "Yuni Shara", "Zaki Iskandar",
];

export function createInitialSeedData(): LocalDbSchema {
  const now = new Date();
  const zonedNow = toZonedTime(now, GYM_TIMEZONE);
  const todayStr = format(zonedNow, "yyyy-MM-dd");
  const defaultPasswordHash = hashPassword("gym123456");

  const ownerId = "11111111-1111-1111-1111-111111111101";
  const kasir1Id = "11111111-1111-1111-1111-111111111102";
  const kasir2Id = "11111111-1111-1111-1111-111111111103";

  const users: StaffUser[] = [
    {
      id: ownerId,
      name: "Hendra Wijaya (Owner)",
      email: "owner@ironpeak.id",
      password_hash: defaultPasswordHash,
      role: "owner",
      is_active: true,
      created_at: subDays(now, 60).toISOString(),
    },
    {
      id: kasir1Id,
      name: "Siti Rahma (Kasir 1)",
      email: "kasir1@ironpeak.id",
      password_hash: defaultPasswordHash,
      role: "cashier",
      is_active: true,
      created_at: subDays(now, 45).toISOString(),
    },
    {
      id: kasir2Id,
      name: "Rizky Pratama (Kasir 2)",
      email: "kasir2@ironpeak.id",
      password_hash: defaultPasswordHash,
      role: "cashier",
      is_active: true,
      created_at: subDays(now, 30).toISOString(),
    },
  ];

  const packages: Package[] = [
    {
      id: "22222222-2222-2222-2222-222222222201",
      name: "Paket Harian (Walk-in)",
      type: "daily",
      duration_days: 1,
      price: 50000,
      registration_fee: 0,
      description: "Akses gym 1 hari penuh tanpa registrasi member",
      is_active: true,
      created_at: subDays(now, 60).toISOString(),
    },
    {
      id: "22222222-2222-2222-2222-222222222202",
      name: "Membership 1 Bulan",
      type: "membership",
      duration_days: 30,
      price: 350000,
      registration_fee: 100000,
      description: "Akses seluruh alat gym selama 30 hari",
      is_active: true,
      created_at: subDays(now, 60).toISOString(),
    },
    {
      id: "22222222-2222-2222-2222-222222222203",
      name: "Membership 3 Bulan",
      type: "membership",
      duration_days: 90,
      price: 950000,
      registration_fee: 100000,
      description: "Hemat Rp 100.000 untuk paket 3 bulan",
      is_active: true,
      created_at: subDays(now, 60).toISOString(),
    },
    {
      id: "22222222-2222-2222-2222-222222222204",
      name: "Membership 6 Bulan",
      type: "membership",
      duration_days: 180,
      price: 1800000,
      registration_fee: 50000,
      description: "Gratis konsultasi awal & akses 6 bulan",
      is_active: true,
      created_at: subDays(now, 60).toISOString(),
    },
    {
      id: "22222222-2222-2222-2222-222222222205",
      name: "Membership 12 Bulan",
      type: "membership",
      duration_days: 365,
      price: 3200000,
      registration_fee: 0,
      description: "Paket tahunan bebas biaya pendaftaran",
      is_active: true,
      created_at: subDays(now, 60).toISOString(),
    },
  ];

  const closedShiftId = "33333333-3333-3333-3333-333333333301";
  const shifts: Shift[] = [
    {
      id: closedShiftId,
      cashier_id: kasir1Id,
      opened_at: subDays(now, 2).toISOString(),
      opening_cash: 500000,
      closed_at: subDays(now, 2).toISOString(),
      expected_cash: 1850000,
      actual_cash: 1850000,
      difference: 0,
      notes: "Shift contoh awal",
      status: "closed",
    },
  ];

  const members: Member[] = [];
  const transactions: Transaction[] = [];
  const memberships: Membership[] = [];
  const checkins: Checkin[] = [];

  for (let i = 1; i <= 50; i++) {
    const memberId = `44444444-4444-4444-4444-${String(i).padStart(12, "0")}`;
    const txId = `55555555-5555-5555-5555-${String(i).padStart(12, "0")}`;
    const isActive = i <= 47;

    let startDate: string;
    let endDate: string;
    let pkg = packages[1]; // 1 Bulan

    if (i <= 25) {
      // Aktif (sisa 10 - 28 hari)
      const offset = (i % 15) + 1;
      startDate = addDaysToDateStr(todayStr, -offset);
      if (i % 7 === 0) {
        pkg = packages[2]; // 3 Bulan
        endDate = addDaysToDateStr(startDate, 89);
      } else {
        endDate = addDaysToDateStr(startDate, 29);
      }
    } else if (i <= 35) {
      // Akan habis (0..6 hari ke depan)
      const rem = (i - 25) % 7;
      endDate = addDaysToDateStr(todayStr, rem);
      startDate = addDaysToDateStr(endDate, -29);
    } else if (i <= 45) {
      // Habis (2..20 hari lalu)
      const ago = (i - 35) * 2;
      endDate = addDaysToDateStr(todayStr, -ago);
      startDate = addDaysToDateStr(endDate, -29);
    } else if (i <= 47) {
      // Belum mulai
      startDate = addDaysToDateStr(todayStr, 3);
      endDate = addDaysToDateStr(startDate, 29);
    } else {
      // Nonaktif
      startDate = addDaysToDateStr(todayStr, -10);
      endDate = addDaysToDateStr(todayStr, 19);
    }

    const createdDaysAgo = Math.max(1, i % 25);
    const createdAt = subDays(now, createdDaysAgo).toISOString();

    members.push({
      id: memberId,
      member_code: `GYM-${String(i).padStart(5, "0")}`,
      full_name: INDONESIAN_NAMES[i - 1],
      phone: `08123456${String(i).padStart(4, "0")}`,
      email: i <= 20 ? `member${i}@contoh.id` : null,
      gender: i % 2 === 0 ? "L" : "P",
      birth_date: "1995-05-15",
      address: "Jakarta Selatan",
      id_number: null,
      photo_url: null,
      emergency_contact: "08111222333",
      notes: null,
      portal_token: `token-member-${String(i).padStart(4, "0")}-${crypto
        .createHash("md5")
        .update(`gym-${i}`)
        .digest("hex")
        .slice(0, 16)}`,
      is_active: isActive,
      last_reminded_at: null,
      last_reminded_by: null,
      created_at: createdAt,
      created_by: i % 2 === 0 ? kasir1Id : kasir2Id,
    });

    const methods = ["cash", "qris", "transfer", "card"] as const;
    const method = methods[i % 4];
    const total = pkg.price + pkg.registration_fee;

    transactions.push({
      id: txId,
      invoice_number: `INV-${todayStr.replaceAll("-", "")}-${String(i).padStart(4, "0")}`,
      type: "registration",
      member_id: memberId,
      guest_name: null,
      guest_phone: null,
      package_id: pkg.id,
      package_price: pkg.price,
      registration_fee: pkg.registration_fee,
      discount: 0,
      discount_reason: null,
      total,
      payment_method: method,
      cash_received: method === "cash" ? total : null,
      change_amount: method === "cash" ? 0 : null,
      cashier_id: i % 2 === 0 ? kasir1Id : kasir2Id,
      shift_id: closedShiftId,
      status: "paid",
      void_reason: null,
      voided_by: null,
      voided_at: null,
      notes: null,
      created_at: createdAt,
    });

    memberships.push({
      id: `66666666-6666-6666-6666-${String(i).padStart(12, "0")}`,
      member_id: memberId,
      package_id: pkg.id,
      transaction_id: txId,
      start_date: startDate,
      end_date: endDate,
      status: "active",
      created_at: createdAt,
    });

    if (i <= 12) {
      const checkinTime = new Date(now);
      checkinTime.setHours(7 + (i % 12), (i * 7) % 60, 0, 0);
      checkins.push({
        id: `77777777-7777-7777-7777-${String(i).padStart(12, "0")}`,
        member_id: memberId,
        transaction_id: null,
        checked_in_at: checkinTime.toISOString(),
        method: i % 2 === 0 ? "qr" : "search",
        is_duplicate: false,
        cashier_id: kasir1Id,
      });
    }
  }

  return {
    gym_settings: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "IronPeak Gym Jakarta",
      address: "Jl. Jend. Sudirman Kav. 45, Jakarta Selatan",
      logo_url: null,
      whatsapp_number: "081299998888",
      reminder_days: 7,
      reminder_template:
        "Halo {nama}, masa aktif membership Anda di {nama_gym} akan berakhir pada {tanggal_habis} ({sisa_hari} hari lagi). Yuk segera perpanjang agar latihan tetap lancar!",
      max_cashier_discount: 50000,
      updated_at: now.toISOString(),
    },
    users,
    packages,
    members,
    memberships,
    transactions,
    checkins,
    shifts,
    activity_logs: [
      {
        id: "88888888-8888-8888-8888-888888888801",
        user_id: ownerId,
        action: "seed_init",
        entity_type: "system",
        entity_id: null,
        details: { message: "Inisialisasi data awal sistem gym" },
        created_at: now.toISOString(),
      },
    ],
  };
}
