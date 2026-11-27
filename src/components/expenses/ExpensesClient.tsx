"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import type {
  Expense,
  ExpenseCategory,
  PaymentMethod,
  StaffRole,
} from "@/types/database";
import {
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  formatDateId,
  formatRupiah,
} from "@/lib/domain/format";

type ExpenseRow = Expense & { creator_name: string };

export function ExpensesClient({
  initialExpenses,
  staffRole,
  canCashierRecord,
  todayStr,
}: {
  initialExpenses: ExpenseRow[];
  staffRole: StaffRole;
  canCashierRecord: boolean;
  todayStr: string;
}) {
  const router = useRouter();
  const [expenses, setExpenses] = useState(initialExpenses);
  const [category, setCategory] = useState<ExpenseCategory>("kebersihan");
  const [amount, setAmount] = useState(50000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [date, setDate] = useState(todayStr);
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const allowedToCreate = staffRole === "owner" || canCashierRecord;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        amount: Number(amount),
        paymentMethod,
        date,
        notes: notes || undefined,
        receiptUrl: receiptUrl || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal mencatat pengeluaran");
      return;
    }
    setNotes("");
    setReceiptUrl("");
    router.refresh();
    window.location.reload();
  }

  async function handleVoid(id: string) {
    if (!confirm("Batalkan (void) catatan pengeluaran ini?")) return;
    const res = await fetch(`/api/expenses/${id}/void`, { method: "POST" });
    if (res.ok) {
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "void" } : e))
      );
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengeluaran</h1>
        <p className="text-sm text-slate-500">
          Catat biaya operasional gym. Pengeluaran tunai kasir otomatis
          mengurangi kas shift.
        </p>
      </div>

      {allowedToCreate ? (
        <form
          onSubmit={handleCreate}
          className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            >
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">
              Nominal (Rp)
            </label>
            <input
              type="number"
              min={1}
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">
              Metode Bayar
            </label>
            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethod)
              }
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="cash">Tunai</option>
              <option value="transfer">Transfer Bank</option>
              <option value="qris">QRIS</option>
              <option value="card">Kartu</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">
              Tanggal
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600">
              Catatan
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Beli galon air minum"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">
              Link Foto Bukti (Opsional)
            </label>
            <input
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Catat
            </button>
          </div>
          {error && (
            <p className="sm:col-span-4 text-sm text-rose-600">{error}</p>
          )}
        </form>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Pencatatan pengeluaran oleh kasir sedang dinonaktifkan oleh owner.
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Metode</th>
              <th className="px-4 py-3">Catatan</th>
              <th className="px-4 py-3">Oleh</th>
              <th className="px-4 py-3 text-right">Nominal</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((e) => (
              <tr
                key={e.id}
                className={e.status === "void" ? "opacity-50" : ""}
              >
                <td className="px-4 py-3 text-xs text-slate-600">
                  {formatDateId(e.date)}
                </td>
                <td className="px-4 py-3 font-medium">
                  {EXPENSE_CATEGORY_LABELS[e.category] || e.category}
                </td>
                <td className="px-4 py-3">
                  {PAYMENT_METHOD_LABELS[e.payment_method]}
                </td>
                <td className="px-4 py-3 text-slate-600">{e.notes || "-"}</td>
                <td className="px-4 py-3 text-slate-500">{e.creator_name}</td>
                <td className="px-4 py-3 text-right font-semibold text-rose-600">
                  {formatRupiah(e.amount)}
                </td>
                <td className="px-4 py-3 text-right">
                  {staffRole === "owner" && e.status === "active" ? (
                    <button
                      type="button"
                      onClick={() => handleVoid(e.id)}
                      className="rounded border border-rose-300 px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-50"
                    >
                      Void
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">
                      {e.status === "void" ? "Void" : "-"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
