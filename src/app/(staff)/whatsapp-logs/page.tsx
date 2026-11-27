import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth/session";
import { listWhatsappLogs } from "@/lib/db/phase2b-service";
import { WhatsappLogsClient } from "@/components/whatsapp/WhatsappLogsClient";

export default async function WhatsappLogsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");

  return <WhatsappLogsClient initialLogs={listWhatsappLogs()} />;
}
