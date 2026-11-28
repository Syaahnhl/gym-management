"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, Calculator, Landmark, Minus, Plus, QrCode, ShoppingCart, Trash2 } from "lucide-react";
import type { Package, PaymentMethod, Product, StaffRole } from "@/types/database";
import { formatRupiah } from "@/lib/domain/format";

interface CartLine {
  product: Product;
  qty: number;
}

export function PosClient({
  products,
  packages,
  members,
  staffRole,
  maxCashierDiscount,
}: {
  products: Product[];
  packages: Package[];
  members: { id: string; member_code: string; full_name: string; phone: string }[];
  staffRole: StaffRole;
  maxCashierDiscount: number;
}) {
  const router = useRouter();
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [memberId, setMemberId] = useState<string>("");
  const [guestName, setGuestName] = useState("Pembeli Umum");
  const [packageId, setPackageId] = useState<string>("");
  const [pkgMemberMode, setPkgMemberMode] = useState<"new" | "existing">("new");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberGender, setNewMemberGender] = useState<"L" | "P">("L");
  const [renewSearch, setRenewSearch] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState(0);
  const [showCalc, setShowCalc] = useState(false);
  const [calcExpr, setCalcExpr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const DENOMINATIONS = [
    { label: "100k", value: 100000 },
    { label: "50k", value: 50000 },
    { label: "20k", value: 20000 },
    { label: "10k", value: 10000 },
    { label: "5k", value: 5000 },
    { label: "2k", value: 2000 },
    { label: "1k", value: 1000 },
    { label: "500", value: 500 },
  ];

  function evalCalcExpression(expr: string): number | null {
    const cleaned = expr.replace(/[^0-9+\-*]/g, "");
    if (!cleaned) return null;
    try {
      const tokens = cleaned.match(/\d+|[+\-*]/g);
      if (!tokens || tokens.length === 0) return null;
      // Evaluate * first, then + and -
      const stack: (number | string)[] = [];
      let i = 0;
      while (i < tokens.length) {
        if (tokens[i] === "*" && stack.length > 0 && i + 1 < tokens.length) {
          const prev = Number(stack.pop());
          const next = Number(tokens[i + 1]);
          stack.push(prev * next);
          i += 2;
        } else {
          stack.push(tokens[i]);
          i += 1;
        }
      }
      let result = Number(stack[0]) || 0;
      for (let j = 1; j < stack.length; j += 2) {
        const op = stack[j];
        const val = Number(stack[j + 1]) || 0;
        if (op === "+") result += val;
        else if (op === "-") result -= val;
      }
      return Math.max(0, Math.round(result));
    } catch {
      return null;
    }
  }

  function addToCart(product: Product) {
    if (product.stock <= 0) {
      setError(`Stok ${product.name} habis.`);
      return;
    }
    setError(null);
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stock) {
          setError(`Stok ${product.name} hanya tersisa ${product.stock}.`);
          return prev;
        }
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function handleBarcodeScan(e: React.FormEvent) {
    e.preventDefault();
    const code = barcode.trim().toLowerCase();
    if (!code) return;
    const found = products.find(
      (p) =>
        (p.sku && p.sku.toLowerCase() === code) ||
        p.name.toLowerCase().includes(code)
    );
    if (!found) {
      setError(`Produk dengan SKU/nama "${barcode}" tidak ditemukan.`);
      return;
    }
    addToCart(found);
    setBarcode("");
  }

  const selectedPkg = packages.find((p) => p.id === packageId) || null;
  const productsSubtotal = cart.reduce(
    (sum, c) => sum + c.product.sell_price * c.qty,
    0
  );
  const subtotal = productsSubtotal + (selectedPkg?.price ?? 0);
  const total = Math.max(0, subtotal - Number(discount || 0));

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (paymentMethod === "cash" && cashReceived < total) {
      setError(`Uang tunai diterima masih kurang ${formatRupiah(total - cashReceived)}.`);
      return;
    }
    setLoading(true);
    try {
      let targetMemberId = memberId || null;

      if (selectedPkg?.type === "membership") {
        if (pkgMemberMode === "new") {
          if (!newMemberName.trim() || !newMemberPhone.trim()) {
            setError("Untuk paket membership member baru, Nama Lengkap dan No. WhatsApp wajib diisi.");
            setLoading(false);
            return;
          }
          const memRes = await fetch("/api/members", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              full_name: newMemberName.trim(),
              phone: newMemberPhone.trim(),
              email: newMemberEmail.trim() || undefined,
              gender: newMemberGender,
              packageId: selectedPkg.id,
              paymentMethod,
              discount: cart.length === 0 ? Number(discount || 0) : 0,
            }),
          });
          const memData = await memRes.json();
          if (!memRes.ok) {
            setError(memData.error || "Gagal mendaftarkan member baru");
            return;
          }
          targetMemberId = memData.member?.id || null;
          if (cart.length === 0) {
            router.push(`/members/${targetMemberId}`);
            router.refresh();
            return;
          }
        } else if (!targetMemberId) {
          setError("Pilih member yang ingin diperpanjang paketnya.");
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:
            selectedPkg && pkgMemberMode === "existing" && selectedPkg.type === "membership"
              ? cart.length > 0
                ? "mixed"
                : "renewal"
              : selectedPkg?.type === "daily" && cart.length === 0
              ? "daily"
              : "pos",
          memberId: targetMemberId,
          guestName: targetMemberId ? null : guestName,
          items: cart.map((c) => ({ productId: c.product.id, qty: c.qty })),
          packageId:
            selectedPkg?.type === "membership" && pkgMemberMode === "new"
              ? null
              : packageId || null,
          discount: Number(discount || 0),
          discountReason: discountReason || undefined,
          paymentMethod,
          cashReceived:
            paymentMethod === "cash" ? Number(cashReceived || 0) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal memproses pembayaran POS");
        return;
      }
      router.push(`/transactions/${data.transaction.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kasir POS Produk</h1>
        <p className="text-sm text-slate-500">
          Scan barcode atau pilih produk, bisa digabung dengan paket membership
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Katalog & Barcode */}
        <div className="space-y-4 lg:col-span-3">
          <form onSubmit={handleBarcodeScan} className="flex gap-2">
            <input
              autoFocus
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan barcode SKU atau ketik nama produk lalu Enter..."
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-mono"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Tambah
            </button>
          </form>

          {/* Paket Visit & Membership */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Paket Visit &amp; Membership
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {packages.map((pkg) => {
                const selected = packageId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setPackageId(selected ? "" : pkg.id)}
                    className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-blue-600 bg-blue-50 ring-2 ring-blue-200"
                        : "border-slate-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          pkg.type === "daily"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {pkg.type === "daily" ? "Visit Harian" : `Membership ${pkg.duration_days}hr`}
                      </span>
                      <p className="mt-2 font-bold text-slate-900 text-sm">{pkg.name}</p>
                    </div>
                    <p className="mt-2 text-sm font-bold text-blue-600">
                      {formatRupiah(pkg.price)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Produk &amp; Layanan POS
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={p.stock <= 0}
                onClick={() => addToCart(p)}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-400 disabled:opacity-50"
              >
                <div>
                  <p className="font-bold text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-500">
                    SKU: {p.sku || "-"} · Stok: {p.stock}
                  </p>
                </div>
                <p className="mt-3 text-base font-bold text-emerald-600">
                  {formatRupiah(p.sell_price)}
                </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Keranjang & Checkout */}
        <form
          onSubmit={handleCheckout}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2"
        >
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <ShoppingCart className="h-5 w-5 text-emerald-600" />
            Keranjang ({cart.reduce((s, c) => s + c.qty, 0)} item)
          </div>

          <div className="max-h-56 space-y-2 overflow-y-auto">
            {cart.map((c) => (
              <div
                key={c.product.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.product.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatRupiah(c.product.sell_price)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCart((prev) =>
                        prev
                          .map((x) =>
                            x.product.id === c.product.id
                              ? { ...x, qty: x.qty - 1 }
                              : x
                          )
                          .filter((x) => x.qty > 0)
                      )
                    }
                    className="rounded border p-1"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center font-semibold">{c.qty}</span>
                  <button
                    type="button"
                    onClick={() => addToCart(c.product)}
                    className="rounded border p-1"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCart((prev) =>
                        prev.filter((x) => x.product.id !== c.product.id)
                      )
                    }
                    className="ml-1 text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <p className="text-xs text-slate-400">Belum ada produk dipilih.</p>
            )}
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-3">
            <div>
              <label className="block text-xs font-medium text-slate-600">
                Pembeli (Member atau Umum)
              </label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">Pembeli Umum (Non-Member)</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.member_code})
                  </option>
                ))}
              </select>
            </div>
            {!memberId && (
              <input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Nama Pembeli Umum"
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600">
                Paket Visit / Membership (Dipilih dari katalog atau dropdown)
              </label>
              <select
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">-- Tidak tambah paket --</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {formatRupiah(p.price)}
                  </option>
                ))}
              </select>
            </div>

            {/* Screen Tambahan Input Data Member saat memilih Paket Membership */}
            {selectedPkg?.type === "membership" && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900">
                    Data Member ({selectedPkg.name})
                  </span>
                  <div className="flex rounded-lg bg-white p-0.5 border border-blue-200 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setPkgMemberMode("new")}
                      className={`rounded-md px-2.5 py-1 ${
                        pkgMemberMode === "new"
                          ? "bg-blue-600 text-white"
                          : "text-slate-600"
                      }`}
                    >
                      Member Baru
                    </button>
                    <button
                      type="button"
                      onClick={() => setPkgMemberMode("existing")}
                      className={`rounded-md px-2.5 py-1 ${
                        pkgMemberMode === "existing"
                          ? "bg-blue-600 text-white"
                          : "text-slate-600"
                      }`}
                    >
                      Perpanjang
                    </button>
                  </div>
                </div>

                {pkgMemberMode === "new" ? (
                  <div className="grid gap-2">
                    <input
                      type="text"
                      required
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Nama Lengkap Member Baru *"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={newMemberPhone}
                      onChange={(e) => setNewMemberPhone(e.target.value)}
                      placeholder="No. WhatsApp (08...) *"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="Email (opsional)"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                      />
                      <select
                        value={newMemberGender}
                        onChange={(e) => setNewMemberGender(e.target.value as "L" | "P")}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={renewSearch}
                      onChange={(e) => setRenewSearch(e.target.value)}
                      placeholder="Ketik nama, no HP, atau kode GYM-..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                    />
                    {memberId ? (
                      (() => {
                        const chosen = members.find((m) => m.id === memberId);
                        return chosen ? (
                          <div className="flex items-center justify-between rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs">
                            <div>
                              <span className="font-bold text-slate-900">{chosen.full_name}</span>{" "}
                              <span className="font-mono text-blue-600">({chosen.member_code})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setMemberId("")}
                              className="text-xs font-semibold text-rose-600 hover:underline"
                            >
                              Ganti
                            </button>
                          </div>
                        ) : null;
                      })()
                    ) : (
                      <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                        {members
                          .filter((m) => {
                            const q = renewSearch.trim().toLowerCase();
                            if (!q) return true;
                            return (
                              m.full_name.toLowerCase().includes(q) ||
                              m.member_code.toLowerCase().includes(q) ||
                              m.phone.toLowerCase().includes(q)
                            );
                          })
                          .slice(0, 6)
                          .map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setMemberId(m.id);
                                setRenewSearch("");
                              }}
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-blue-50"
                            >
                              <span className="font-semibold text-slate-900">{m.full_name}</span>
                              <span className="font-mono text-slate-500">{m.member_code}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600">
                Diskon (Rp){" "}
                {staffRole === "cashier" && `(maks ${formatRupiah(maxCashierDiscount)})`}
              </label>
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            {discount > 0 && (
              <input
                required
                placeholder="Alasan diskon *"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            )}

            {/* 3 Mode Pembayaran */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "cash" as PaymentMethod, label: "Tunai", icon: Banknote },
                  { id: "qris" as PaymentMethod, label: "QRIS", icon: QrCode },
                  { id: "transfer" as PaymentMethod, label: "Transfer", icon: Landmark },
                ].map((m) => {
                  const Icon = m.icon;
                  const active = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${
                        active
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentMethod === "cash" ? (
              <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Uang Diterima (Tunai)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashReceived(total)}
                      className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-200"
                    >
                      Uang Pas
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashReceived(0)}
                      className="rounded-md bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700 hover:bg-slate-300"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCalc((v) => !v)}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        showCalc
                          ? "bg-blue-600 text-white"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                    >
                      <Calculator className="h-3 w-3" />
                      Kalkulator
                    </button>
                  </div>
                </div>

                <input
                  type="number"
                  min={0}
                  required
                  value={cashReceived || ""}
                  placeholder="Ketik nominal uang diterima..."
                  onChange={(e) => setCashReceived(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
                />

                {/* Pecahan Uang */}
                <div>
                  <p className="mb-1 text-[11px] font-medium text-slate-500">
                    Tambah Pecahan Uang:
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {DENOMINATIONS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setCashReceived((prev) => prev + d.value)}
                        className="rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
                      >
                        +{d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kalkulator Mini */}
                {showCalc && (
                  <div className="rounded-xl border border-blue-200 bg-white p-2.5 space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2 text-right font-mono text-sm text-white">
                      <span className="text-[11px] text-slate-400">CALC</span>
                      <span className="truncate font-bold">{calcExpr || "0"}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {["7", "8", "9", "+", "4", "5", "6", "-", "1", "2", "3", "*", "C", "0", "000", "⌫"].map(
                        (btn) => (
                          <button
                            key={btn}
                            type="button"
                            onClick={() => {
                              if (btn === "C") setCalcExpr("");
                              else if (btn === "⌫") setCalcExpr((p) => p.slice(0, -1));
                              else setCalcExpr((p) => p + btn);
                            }}
                            className={`rounded-lg py-1.5 text-xs font-bold transition ${
                              ["+", "-", "*"].includes(btn)
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                : btn === "C"
                                ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                                : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                            }`}
                          >
                            {btn}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const res = evalCalcExpression(calcExpr);
                        if (res !== null) {
                          setCashReceived(res);
                          setCalcExpr(String(res));
                        }
                      }}
                      className="w-full rounded-lg bg-blue-600 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      = Hitung &amp; Pakai ke Uang Diterima
                    </button>
                  </div>
                )}

                {/* Kembalian / Kurang */}
                {total > 0 && (
                  <div
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-bold ${
                      cashReceived >= total
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    <span>{cashReceived >= total ? "Kembalian" : "Kurang Bayar"}</span>
                    <span>
                      {cashReceived >= total
                        ? formatRupiah(cashReceived - total)
                        : formatRupiah(total - cashReceived)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-800">
                {paymentMethod === "qris"
                  ? "Mode QRIS: Pastikan pelanggan sudah scan QRIS dan pembayaran terkonfirmasi berhasil."
                  : "Mode Transfer: Pastikan bukti transfer bank sudah dicek dan nominal sesuai total bayar."}
              </div>
            )}
          </div>

          <div className="flex justify-between rounded-xl bg-slate-50 p-3 text-base font-bold">
            <span>Total Bayar</span>
            <span className="text-emerald-700">{formatRupiah(total)}</span>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || (cart.length === 0 && !packageId)}
            className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Bayar & Cetak Struk"}
          </button>
        </form>
      </div>
    </div>
  );
}
