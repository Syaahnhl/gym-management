"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Plus, UserPlus } from "lucide-react";
import type { Lead, LeadStatus } from "@/types/database";
import { buildWhatsAppUrl, formatDateId } from "@/lib/domain/format";

const STATUS_LABELS: Record<LeadStatus, { label: string; cls: string }> = {
  baru: { label: "Baru", cls: "bg-slate-100 text-slate-700" },
  followup: { label: "Follow-up", cls: "bg-amber-100 text-amber-800" },
  trial: { label: "Free Trial", cls: "bg-blue-100 text-blue-700" },
  converted: { label: "Jadi Member", cls: "bg-emerald-100 text-emerald-700" },
  lost: { label: "Batal", cls: "bg-rose-100 text-rose-700" },
};

export function LeadsClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("Instagram Ads");
  const [interest, setInterest] = useState("Paket Bulanan");
  const [notes, setNotes] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: name, phone, source, interest_package: interest, notes }),
    });
    const data = await res.json();
    if (res.ok && data.lead) {
      setLeads([data.lead, ...leads]);
      setName("");
      setPhone("");
      setNotes("");
    }
  }

  async function changeStatus(id: string, status: LeadStatus) {
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setLeads(leads.map((l) => (l.id === id ? { ...l, status } : l)));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">CRM Prospek &amp; Free Trial</h1>
        <p className="text-sm text-slate-500">Kelola calon member dari IG/Walk-in hingga konversi jadi member aktif</p>
      </div>

      <form onSubmit={handleAdd} className="grid gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:grid-cols-5">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama prospek..." className="rounded-xl border border-slate-300 px-3 py-2 text-xs" />
        <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="No. WA..." className="rounded-xl border border-slate-300 px-3 py-2 text-xs" />
        <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-xs">
          <option>Instagram Ads</option>
          <option>Walk-in</option>
          <option>WhatsApp</option>
          <option>Referral</option>
        </select>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Minat / Catatan..." className="rounded-xl border border-slate-300 px-3 py-2 text-xs" />
        <button type="submit" className="inline-flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
          <Plus className="h-3.5 w-3.5" /> Tambah Prospek
        </button>
      </form>

      <div className="space-y-3">
        {leads.map((l) => (
          <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900">{l.full_name}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_LABELS[l.status].cls}`}>
                  {STATUS_LABELS[l.status].label}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {l.phone} · Sumber: {l.source} · Minat: {l.interest_package} · {formatDateId(l.created_at)}
              </p>
              {l.notes && <p className="mt-1 text-xs text-slate-600">{l.notes}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={l.status} onChange={(e) => changeStatus(l.id, e.target.value as LeadStatus)} className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs">
                <option value="baru">Baru</option>
                <option value="followup">Follow-up</option>
                <option value="trial">Free Trial</option>
                <option value="converted">Jadi Member</option>
                <option value="lost">Batal</option>
              </select>
              <a href={buildWhatsAppUrl(l.phone, `Halo ${l.full_name}, terima kasih sudah tertarik latihan di gym kami!`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">
                <MessageCircle className="h-3.5 w-3.5" /> Chat WA
              </a>
              <Link href="/members/new" className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700">
                <UserPlus className="h-3.5 w-3.5" /> Daftarkan
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
