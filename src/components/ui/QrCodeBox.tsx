"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCodeBox({
  value,
  size = 180,
}: {
  value: string;
  size?: number;
}) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="animate-pulse rounded-xl bg-slate-100"
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR ${value}`}
      width={size}
      height={size}
      className="rounded-xl border border-slate-200 bg-white p-1"
    />
  );
}
