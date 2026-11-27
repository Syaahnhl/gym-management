import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { listProducts } from "@/lib/db/service";
import { ProductsClient } from "@/components/products/ProductsClient";

export default async function ProductsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (staff.role !== "owner") redirect("/dashboard");

  return <ProductsClient initialProducts={listProducts(false)} />;
}
