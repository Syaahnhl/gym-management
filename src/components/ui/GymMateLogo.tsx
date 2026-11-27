import React from "react";

interface GymMateLogoProps {
  className?: string;
  variant?: "default" | "on-blue";
}

export function GymMateLogo({
  className = "w-7 h-7",
  variant = "default",
}: GymMateLogoProps) {
  const primary = variant === "on-blue" ? "#FFFFFF" : "#2563EB";
  const secondary = variant === "on-blue" ? "#93C5FD" : "#DBEAFE";
  const accentBar = variant === "on-blue" ? "#FFFFFF" : "#2563EB";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 48"
      fill="none"
      className={className}
      aria-label="Logo GymMate"
    >
      {/* Ascending analytics bars above barbell */}
      <rect x="20.5" y="21" width="4.2" height="5" rx="0.8" fill={secondary} />
      <rect x="26.5" y="16" width="4.2" height="10" rx="0.8" fill={accentBar} />
      <rect x="32.5" y="11" width="4.2" height="15" rx="0.8" fill={secondary} />
      <rect x="38.5" y="6" width="4.2" height="20" rx="0.8" fill={accentBar} />

      {/* Barbell bar */}
      <rect x="13" y="27.5" width="38" height="4.5" rx="1.5" fill={primary} />

      {/* Left plates */}
      <rect x="13.5" y="17" width="4.8" height="25.5" rx="2.2" fill={primary} />
      <rect x="8.2" y="20.5" width="4.2" height="18.5" rx="2" fill={primary} />
      <rect x="4.5" y="25.5" width="2.6" height="8.5" rx="1.3" fill={primary} />

      {/* Right plates */}
      <rect x="45.7" y="17" width="4.8" height="25.5" rx="2.2" fill={primary} />
      <rect x="51.6" y="20.5" width="4.2" height="18.5" rx="2" fill={primary} />
      <rect x="56.9" y="25.5" width="2.6" height="8.5" rx="1.3" fill={primary} />
    </svg>
  );
}
