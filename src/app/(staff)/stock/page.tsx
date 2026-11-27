import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { listProducts, listStockMovements } from "@/lib/db/service";
import { StockClient } from "@/components/products/StockClient";

export default async function StockPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (staff.role !== "owner") redirect("/dashboard");

  return (
    <StockClient
      initialProducts={listProducts(false)}
      initialMovements={listStockMovements()}
    />
  );
}
