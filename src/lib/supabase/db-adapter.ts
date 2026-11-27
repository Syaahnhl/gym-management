import { createSupabaseAdminClient, isSupabaseConfigured } from "./config";

/**
 * Adapter Supabase untuk mode produksi:
 * - Memeriksa status koneksi Supabase
 * - Mengunggah file/foto ke Supabase Storage bucket 'gym-assets' (fallback ke data URL di mode lokal)
 */
export async function checkStorageMode(): Promise<{
  mode: "supabase" | "local";
  connected: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { mode: "local", connected: true };
  }
  try {
    const client = createSupabaseAdminClient();
    const { error } = await client.from("gym_settings").select("id").limit(1);
    return { mode: "supabase", connected: !error };
  } catch {
    return { mode: "supabase", connected: false };
  }
}

export async function uploadAssetToStorage(
  folder: "members" | "expenses" | "freezes" | "logo",
  fileName: string,
  base64DataUrl: string
): Promise<string> {
  if (!isSupabaseConfigured()) {
    // Mode lokal: simpan data URL langsung
    return base64DataUrl;
  }

  const client = createSupabaseAdminClient();
  const base64 = base64DataUrl.split(",")[1];
  if (!base64) return base64DataUrl;

  const buffer = Buffer.from(base64, "base64");
  const filePath = `${folder}/${Date.now()}-${fileName}`;
  const { error } = await client.storage
    .from("gym-assets")
    .upload(filePath, buffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) {
    // Fallback aman jika bucket belum dibuat
    return base64DataUrl;
  }

  const { data } = client.storage.from("gym-assets").getPublicUrl(filePath);
  return data.publicUrl;
}
