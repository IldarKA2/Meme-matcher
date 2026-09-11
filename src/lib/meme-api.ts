import { supabase } from "@/integrations/supabase/client";

export type Meme = {
  id: string;
  image_url: string;
  top_text: string;
  bottom_text: string;
  language: string;
  category: string;
};

export type Swipe = {
  meme_id: string;
  action: "like" | "dislike";
  created_at: string;
};

export async function fetchMemes(): Promise<Meme[]> {
  const { data, error } = await supabase
    .from("memes")
    .select("id, image_url, top_text, bottom_text, language, category")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Meme[];
}

export async function fetchSwipes(deviceId: string): Promise<Swipe[]> {
  const { data, error } = await supabase
    .from("swipes")
    .select("meme_id, action, created_at")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Swipe[];
}

export async function fetchSaved(deviceId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("saved_memes")
    .select("meme_id")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => r.meme_id as string);
}

export async function recordSwipe(
  deviceId: string,
  memeId: string,
  action: "like" | "dislike",
) {
  const { error } = await supabase
    .from("swipes")
    .upsert({ device_id: deviceId, meme_id: memeId, action }, { onConflict: "device_id,meme_id" });
  if (error) throw error;
}

export async function saveMeme(deviceId: string, memeId: string) {
  const { error } = await supabase
    .from("saved_memes")
    .upsert({ device_id: deviceId, meme_id: memeId }, { onConflict: "device_id,meme_id" });
  if (error) throw error;
}

export async function unsaveMeme(deviceId: string, memeId: string) {
  const { error } = await supabase
    .from("saved_memes")
    .delete()
    .eq("device_id", deviceId)
    .eq("meme_id", memeId);
  if (error) throw error;
}

export async function resetHistory(deviceId: string) {
  const a = await supabase.from("swipes").delete().eq("device_id", deviceId);
  if (a.error) throw a.error;
  const b = await supabase.from("saved_memes").delete().eq("device_id", deviceId);
  if (b.error) throw b.error;
}
