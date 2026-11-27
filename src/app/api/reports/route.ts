import { NextRequest, NextResponse } from "next/server";
import { format, subDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { requireApiStaff } from "@/lib/auth/session";
import { readLocalDb } from "@/lib/db/local-store";
import { listMembersWithStatus } from "@/lib/db/service";
import { GYM_TIMEZONE, getJakartaTodayStr } from "@/lib/domain/membership";

export async function GET(req: NextRequest) {
  const auth = await requireApiStaff(["owner"]);
  if ("error" in auth) return auth.error;

  const from = req.nextUrl.searchParams.get("from") || "";
  const to = req.nextUrl.searchParams.get("to") || "";

  const db = readLocalDb();
  const todayStr = getJakartaTodayStr();
  const monthPrefix = todayStr.slice(0, 7); // YYYY-MM

  const paidTxs = db.transactions.filter((t) => t.status === "paid");
  const pkgMap = new Map(db.packages.map((p) => [p.id, p.name]));
  const userMap = new Map(db.users.map((u) => [u.id, u.name]));

  const filteredTxs = paidTxs.filter((t) => {
    const d = getJakartaTodayStr(new Date(t.created_at));
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });

  const revenueToday = paidTxs
    .filter((t) => getJakartaTodayStr(new Date(t.created_at)) === todayStr)
    .reduce((acc, t) => acc + t.total, 0);

  const revenueMonth = paidTxs
    .filter((t) => getJakartaTodayStr(new Date(t.created_at)).startsWith(monthPrefix))
    .reduce((acc, t) => acc + t.total, 0);

  const members = listMembersWithStatus();
  const activeCount = members.filter(
    (m) => m.status_info.status === "active" || m.status_info.status === "expiring"
  ).length;
  const expiringCount = members.filter(
    (m) => m.status_info.status === "expiring"
  ).length;
  const expiredCount = members.filter(
    (m) => m.status_info.status === "expired"
  ).length;

  const newMembersMonth = paidTxs.filter(
    (t) =>
      t.type === "registration" &&
      getJakartaTodayStr(new Date(t.created_at)).startsWith(monthPrefix)
  ).length;

  const renewalsMonth = paidTxs.filter(
    (t) =>
      t.type === "renewal" &&
      getJakartaTodayStr(new Date(t.created_at)).startsWith(monthPrefix)
  ).length;

  const checkinsToday = db.checkins.filter(
    (c) => getJakartaTodayStr(new Date(c.checked_in_at)) === todayStr && !c.is_duplicate
  ).length;

  // 30-day revenue series
  const revenue30Days: { date: string; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const dStr = format(
      toZonedTime(subDays(new Date(), i), GYM_TIMEZONE),
      "yyyy-MM-dd"
    );
    const sum = paidTxs
      .filter((t) => getJakartaTodayStr(new Date(t.created_at)) === dStr)
      .reduce((acc, t) => acc + t.total, 0);
    revenue30Days.push({ date: dStr.slice(5), total: sum });
  }

  // Hourly checkins
  const hourlyMap = new Map<number, number>();
  for (let h = 6; h <= 22; h++) hourlyMap.set(h, 0);
  for (const c of db.checkins) {
    const zoned = toZonedTime(new Date(c.checked_in_at), GYM_TIMEZONE);
    const h = zoned.getHours();
    if (hourlyMap.has(h)) {
      hourlyMap.set(h, (hourlyMap.get(h) || 0) + 1);
    }
  }
  const hourlyCheckins = Array.from(hourlyMap.entries()).map(([hour, count]) => ({
    hour: `${String(hour).padStart(2, "0")}:00`,
    count,
  }));

  // Groupings for revenue report
  const byMethod: Record<string, number> = {};
  const byPackage: Record<string, number> = {};
  const byCashier: Record<string, number> = {};
  const byDay: Record<string, number> = {};

  for (const t of filteredTxs) {
    byMethod[t.payment_method] = (byMethod[t.payment_method] || 0) + t.total;
    const pkgName = t.package_id ? pkgMap.get(t.package_id) || "Lainnya" : "Produk POS";
    byPackage[pkgName] = (byPackage[pkgName] || 0) + t.total;
    const cashierName = userMap.get(t.cashier_id) || "Staff";
    byCashier[cashierName] = (byCashier[cashierName] || 0) + t.total;
    const dayStr = getJakartaTodayStr(new Date(t.created_at));
    byDay[dayStr] = (byDay[dayStr] || 0) + t.total;
  }

  const filteredCheckins = db.checkins
    .filter((c) => {
      const d = getJakartaTodayStr(new Date(c.checked_in_at));
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    })
    .map((c) => {
      const m = c.member_id ? members.find((x) => x.id === c.member_id) : null;
      return {
        ...c,
        member_name: m?.full_name || "Pengunjung Harian",
        member_code: m?.member_code || "WALK-IN",
      };
    });

  return NextResponse.json({
    summary: {
      revenue_today: revenueToday,
      revenue_month: revenueMonth,
      active_members: activeCount,
      expiring_members: expiringCount,
      expired_members: expiredCount,
      new_members_month: newMembersMonth,
      renewals_month: renewalsMonth,
      checkins_today: checkinsToday,
    },
    charts: {
      revenue_30_days: revenue30Days,
      hourly_checkins: hourlyCheckins,
    },
    revenue_report: {
      total: filteredTxs.reduce((acc, t) => acc + t.total, 0),
      count: filteredTxs.length,
      by_method: byMethod,
      by_package: byPackage,
      by_cashier: byCashier,
      by_day: byDay,
    },
    checkins: filteredCheckins,
  });
}
