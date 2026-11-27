export interface BmiResult {
  bmi: number;
  category: "Kurus" | "Normal (Ideal)" | "Overweight" | "Obesitas";
  badgeClass: string;
  barPercent: number;
}

export function calculateBmi(weightKg: number, heightCm: number): BmiResult | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const raw = weightKg / (heightM * heightM);
  const bmi = Math.round(raw * 10) / 10;

  let category: BmiResult["category"] = "Normal (Ideal)";
  let badgeClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (bmi < 18.5) {
    category = "Kurus";
    badgeClass = "bg-sky-100 text-sky-800 border-sky-200";
  } else if (bmi < 25) {
    category = "Normal (Ideal)";
    badgeClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
  } else if (bmi < 30) {
    category = "Overweight";
    badgeClass = "bg-amber-100 text-amber-800 border-amber-200";
  } else {
    category = "Obesitas";
    badgeClass = "bg-rose-100 text-rose-800 border-rose-200";
  }

  // Map BMI 15..35 to 0..100% on gauge bar
  const clamped = Math.min(35, Math.max(15, bmi));
  const barPercent = Math.round(((clamped - 15) / 20) * 100);

  return { bmi, category, badgeClass, barPercent };
}
