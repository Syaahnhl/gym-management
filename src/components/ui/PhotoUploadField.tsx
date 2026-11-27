"use client";

import { useState } from "react";
import { Camera } from "lucide-react";

export function PhotoUploadField({
  label,
  folder,
  value,
  onChange,
}: {
  label: string;
  folder: "members" | "expenses" | "freezes" | "logo";
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = String(reader.result || "");
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder, fileName: file.name, dataUrl }),
        });
        const d = await res.json();
        if (res.ok && d.url) {
          onChange(d.url);
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="mt-1 flex items-center gap-3">
        {value && (
          <img
            src={value}
            alt={label}
            className="h-12 w-12 rounded-lg border object-cover"
          />
        )}
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          <Camera className="h-4 w-4" />
          {uploading ? "Mengunggah..." : "Ambil / Pilih Foto"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-rose-600 hover:underline"
          >
            Hapus
          </button>
        )}
      </div>
    </div>
  );
}
