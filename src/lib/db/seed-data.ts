import crypto from "crypto";
import { subDays, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { GYM_TIMEZONE, addDaysToDateStr } from "@/lib/domain/membership";
import type {
  ActivityLog,
  BodyMetric,
  Branch,
  Checkin,
  ClassBooking,
  ClassSchedule,
  Expense,
  Freeze,
  GymSettings,
  Lead,
  Locker,
  Member,
  Membership,
  Package,
  PaymentIntent,
  Product,
  Promotion,
  PtPackage,
  PtSession,
  Referral,
  Shift,
  StaffUser,
  StockMovement,
  Trainer,
  Transaction,
  TransactionItem,
  WhatsappLog,
} from "@/types/database";

export interface LocalDbSchema {
  gym_settings: GymSettings;
  users: StaffUser[];
  packages: Package[];
  members: Member[];
  memberships: Membership[];
  freezes: Freeze[];
  products: Product[];
  stock_movements: StockMovement[];
  transactions: Transaction[];
  transaction_items: TransactionItem[];
  expenses: Expense[];
  promotions: Promotion[];
  referrals: Referral[];
  trainers: Trainer[];
  pt_packages: PtPackage[];
  pt_sessions: PtSession[];
  class_schedules: ClassSchedule[];
  class_bookings: ClassBooking[];
  payment_intents: PaymentIntent[];
  whatsapp_logs: WhatsappLog[];
  branches: Branch[];
  checkins: Checkin[];
  shifts: Shift[];
  leads: Lead[];
  lockers: Locker[];
  body_metrics: BodyMetric[];
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
      referral_code: `REF-${String(i).padStart(5, "0")}`,
      discount_balance: 0,
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

  const freezes: Freeze[] = [
    {
      id: "99999999-9999-9999-9999-999999999901",
      member_id: members[2].id,
      membership_id: memberships[2].id,
      start_date: addDaysToDateStr(todayStr, -2),
      end_date: addDaysToDateStr(todayStr, 5),
      actual_end_date: null,
      reason: "dinas",
      reason_notes: "Tugas luar kota 8 hari",
      attachment_url: null,
      fee: 0,
      status: "active",
      cancel_reason: null,
      created_by: kasir1Id,
      created_at: subDays(now, 2).toISOString(),
    },
  ];

  const products: Product[] = [
    {
      id: "prod-1",
      name: "Air Mineral 600ml",
      category: "minuman",
      sku: "8991001001",
      sell_price: 8000,
      cost_price: 3500,
      stock: 48,
      min_stock: 15,
      is_active: true,
      created_at: subDays(now, 30).toISOString(),
    },
    {
      id: "prod-2",
      name: "Minuman Isotonik 500ml",
      category: "minuman",
      sku: "8991001002",
      sell_price: 12000,
      cost_price: 6500,
      stock: 24,
      min_stock: 10,
      is_active: true,
      created_at: subDays(now, 30).toISOString(),
    },
    {
      id: "prod-3",
      name: "Whey Protein Sachet (35g)",
      category: "suplemen",
      sku: "8991002001",
      sell_price: 35000,
      cost_price: 22000,
      stock: 4, // Di bawah stok minimum (peringatan dashboard!)
      min_stock: 10,
      is_active: true,
      created_at: subDays(now, 30).toISOString(),
    },
    {
      id: "prod-4",
      name: "Pre-Workout Shot",
      category: "suplemen",
      sku: "8991002002",
      sell_price: 30000,
      cost_price: 18000,
      stock: 15,
      min_stock: 5,
      is_active: true,
      created_at: subDays(now, 30).toISOString(),
    },
    {
      id: "prod-5",
      name: "Kaos IronPeak Dry-Fit",
      category: "merchandise",
      sku: "8991003001",
      sell_price: 150000,
      cost_price: 85000,
      stock: 12,
      min_stock: 5,
      is_active: true,
      created_at: subDays(now, 30).toISOString(),
    },
    {
      id: "prod-6",
      name: "Sewa Handuk & Loker Harian",
      category: "sewa",
      sku: "8991004001",
      sell_price: 15000,
      cost_price: 2000,
      stock: 30,
      min_stock: 5,
      is_active: true,
      created_at: subDays(now, 30).toISOString(),
    },
  ];

  const expenses: Expense[] = [
    {
      id: "exp-1",
      category: "listrik",
      amount: 1500000,
      payment_method: "transfer",
      date: todayStr,
      notes: "Tagihan listrik bulan ini",
      receipt_url: null,
      shift_id: null,
      status: "active",
      created_by: ownerId,
      created_at: subDays(now, 1).toISOString(),
    },
    {
      id: "exp-2",
      category: "kebersihan",
      amount: 250000,
      payment_method: "cash",
      date: todayStr,
      notes: "Beli cairan disinfektan & lap gym",
      receipt_url: null,
      shift_id: closedShiftId,
      status: "active",
      created_by: kasir1Id,
      created_at: subDays(now, 2).toISOString(),
    },
  ];

  const promotions: Promotion[] = [
    {
      id: "promo-1",
      name: "Diskon Member Baru 20%",
      code: "BARU20",
      discount_type: "percent",
      discount_value: 20,
      applies_to: "package",
      target_ids: [],
      start_date: addDaysToDateStr(todayStr, -15),
      end_date: addDaysToDateStr(todayStr, 30),
      max_quota: 50,
      max_per_member: 1,
      new_member_only: true,
      is_active: true,
      created_at: subDays(now, 15).toISOString(),
    },
    {
      id: "promo-2",
      name: "Potongan Rp 50.000 Semua Paket",
      code: "HEMAT50",
      discount_type: "nominal",
      discount_value: 50000,
      applies_to: "all",
      target_ids: [],
      start_date: addDaysToDateStr(todayStr, -10),
      end_date: addDaysToDateStr(todayStr, 30),
      max_quota: 100,
      max_per_member: 2,
      new_member_only: false,
      is_active: true,
      created_at: subDays(now, 10).toISOString(),
    },
  ];

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
      freeze_allowed: true,
      freeze_min_days: 3,
      freeze_max_days: 30,
      freeze_max_days_per_period: 30,
      freeze_fee: 0,
      cashier_can_record_expense: true,
      referral_enabled: true,
      referral_discount_amount: 50000,
      referral_reward_type: "days",
      referral_reward_value: 7,
      payment_gateway_provider: "midtrans",
      payment_gateway_server_key: null,
      auto_wa_enabled: false,
      wa_api_provider: "fonnte",
      wa_api_token: null,
      turnstile_enabled: false,
      turnstile_webhook_url: null,
      updated_at: now.toISOString(),
    },
    users,
    packages,
    members,
    memberships,
    freezes,
    products,
    stock_movements: [],
    transactions,
    transaction_items: [],
    expenses,
    promotions,
    referrals: [],
    trainers: [
      {
        id: "tr-1",
        name: "Coach Reza Pratama",
        phone: "081211112222",
        specialty: "Strength & Hypertrophy",
        commission_type: "percent",
        commission_value: 40,
        is_active: true,
        created_at: subDays(now, 30).toISOString(),
      },
      {
        id: "tr-2",
        name: "Coach Nadia Putri",
        phone: "081233334444",
        specialty: "Zumba, HIIT & Mobility",
        commission_type: "fixed",
        commission_value: 100000,
        is_active: true,
        created_at: subDays(now, 30).toISOString(),
      },
    ],
    pt_packages: [
      {
        id: "ptp-1",
        name: "Paket PT 5 Sesi",
        sessions_count: 5,
        price: 1250000,
        validity_days: 45,
        is_active: true,
        created_at: subDays(now, 30).toISOString(),
      },
      {
        id: "ptp-2",
        name: "Paket PT 10 Sesi",
        sessions_count: 10,
        price: 2200000,
        validity_days: 90,
        is_active: true,
        created_at: subDays(now, 30).toISOString(),
      },
    ],
    pt_sessions: [
      {
        id: "pts-1",
        member_id: "44444444-4444-4444-4444-000000000001",
        trainer_id: "tr-1",
        pt_package_id: "ptp-1",
        session_date: todayStr,
        session_time: "10:00",
        session_fee: 250000,
        commission_amount: 100000,
        status: "completed",
        notes: "Upper body strength",
        created_by: kasir1Id,
        created_at: now.toISOString(),
      },
    ],
    class_schedules: [
      {
        id: "cls-1",
        title: "Morning HIIT Burn",
        trainer_id: "tr-2",
        class_date: todayStr,
        start_time: "07:00",
        end_time: "08:00",
        max_capacity: 15,
        fee_per_session: 0,
        is_active: true,
        created_at: now.toISOString(),
      },
      {
        id: "cls-2",
        title: "Evening Zumba Party",
        trainer_id: "tr-2",
        class_date: addDaysToDateStr(todayStr, 1),
        start_time: "18:30",
        end_time: "19:30",
        max_capacity: 20,
        fee_per_session: 0,
        is_active: true,
        created_at: now.toISOString(),
      },
    ],
    class_bookings: [],
    payment_intents: [],
    whatsapp_logs: [],
    branches: [
      {
        id: "branch-1",
        name: "Cabang Pusat Sudirman",
        address: "Jl. Jend. Sudirman Kav. 45, Jakarta Selatan",
        phone: "081299998888",
        is_active: true,
        created_at: subDays(now, 60).toISOString(),
      },
      {
        id: "branch-2",
        name: "Cabang Kemang",
        address: "Jl. Kemang Raya No. 18, Jakarta Selatan",
        phone: "081277776666",
        is_active: true,
        created_at: subDays(now, 20).toISOString(),
      },
    ],
    checkins,
    shifts,
    leads: [
      {
        id: "lead-1",
        full_name: "Kevin Wijaya",
        phone: "081233445566",
        source: "Instagram Ads",
        interest_package: "Paket 3 Bulan",
        status: "trial",
        notes: "Mau coba alat kaki & konsultasi PT",
        trial_date: todayStr,
        created_at: now.toISOString(),
      },
      {
        id: "lead-2",
        full_name: "Nadia Kusuma",
        phone: "081377889900",
        source: "Walk-in",
        interest_package: "Paket Bulanan",
        status: "followup",
        notes: "Tanya jadwal kelas Yoga malam",
        trial_date: null,
        created_at: subDays(now, 1).toISOString(),
      },
    ],
    lockers: Array.from({ length: 12 }, (_, idx) => ({
      id: `lock-${idx + 1}`,
      code: `L-${String(idx + 1).padStart(2, "0")}`,
      member_id: idx === 0 ? members[0]?.id ?? null : null,
      member_name: idx === 0 ? members[0]?.full_name ?? null : null,
      assigned_at: idx === 0 ? now.toISOString() : null,
      status: idx === 0 ? ("occupied" as const) : ("available" as const),
    })),
    body_metrics: [
      {
        id: "bm-1",
        member_id: members[0]?.id ?? "mem-1",
        recorded_at: subDays(now, 30).toISOString().slice(0, 10),
        weight_kg: 78.5,
        height_cm: 175,
        body_fat_percent: 21.4,
        muscle_mass_kg: 34.2,
        waist_cm: 86,
        notes: "Pengukuran awal program hypertrophy",
      },
      {
        id: "bm-2",
        member_id: members[0]?.id ?? "mem-1",
        recorded_at: todayStr,
        weight_kg: 76.8,
        height_cm: 175,
        body_fat_percent: 19.2,
        muscle_mass_kg: 35.1,
        waist_cm: 83,
        notes: "Turun lemak 2.2%, massa otot naik",
      },
    ],
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
