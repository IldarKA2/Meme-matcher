import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type MemeRow = {
  id: string;
  template: string;
  lines: string[];
  language: string;
  category: string;
};

export type UserStatistics = {
  total_swipes: number;
  likes_count: number;
  dislikes_count: number;
  saves_count: number;
  top_category: string | null;
  updated_at: string;
};

function fail(context: string, error: { message: string } | null): never {
  console.error(`[meme.server] ${context}:`, error?.message ?? "unknown error");
  throw new Error(`${context}. Please try again.`);
}

/** Ensure a users row exists for this device and refresh last_active_at. */
export async function touchUser(deviceId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("users")
    .upsert(
      { device_id: deviceId, last_active_at: new Date().toISOString() },
      { onConflict: "device_id" },
    );
  if (error) fail("Could not register this device", error);
}

function slug(text: string) {
  const escaped = text
    .replace(/_/g, "__")
    .replace(/-/g, "--")
    .replace(/ /g, "_")
    .replace(/\?/g, "~q")
    .replace(/%/g, "~p")
    .replace(/#/g, "~h")
    .replace(/\//g, "~s")
    .replace(/"/g, "''");
  return encodeURIComponent(escaped).replace(/%5F/g, "_").replace(/%7E/g, "~").replace(/%27/g, "'");
}

/** Upstream meme-image service URL. Only ever called from server code. */
export function upstreamImageUrl(meme: MemeRow, width: number) {
  const path = (meme.lines.length ? meme.lines : ["_"]).map(slug).join("/");
  return `https://api.memegen.link/images/${meme.template}/${path}.png?width=${width}`;
}

export async function getMemeById(memeId: string): Promise<MemeRow | null> {
  const { data, error } = await supabaseAdmin
    .from("memes")
    .select("id, template, lines, language, category")
    .eq("id", memeId)
    .maybeSingle();
  if (error) fail("Could not load that meme", error);
  return (data as MemeRow | null) ?? null;
}

async function swipedMemeIds(deviceId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("swipes")
    .select("meme_id")
    .eq("device_id", deviceId);
  if (error) fail("Could not load your swipe history", error);
  return (data ?? []).map((r) => r.meme_id as string);
}

/** Random memes the device has not swiped yet. Empty array = deck exhausted. */
export async function getRandomMemes(
  deviceId: string,
  count: number,
): Promise<{ memes: MemeRow[]; remaining: number }> {
  const seen = new Set(await swipedMemeIds(deviceId));
  const { data, error } = await supabaseAdmin
    .from("memes")
    .select("id, template, lines, language, category");
  if (error) fail("Could not load memes", error);

  const pool = ((data ?? []) as MemeRow[]).filter((m) => !seen.has(m.id));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return { memes: pool.slice(0, count), remaining: pool.length };
}

export async function recalculateStatistics(deviceId: string): Promise<UserStatistics> {
  const [swipeRes, savedRes] = await Promise.all([
    supabaseAdmin.from("swipes").select("meme_id, action").eq("device_id", deviceId),
    supabaseAdmin.from("saved_memes").select("meme_id").eq("device_id", deviceId),
  ]);
  if (swipeRes.error) fail("Could not read your swipes", swipeRes.error);
  if (savedRes.error) fail("Could not read your saved memes", savedRes.error);

  const swipes = (swipeRes.data ?? []) as { meme_id: string; action: string }[];
  const likes = swipes.filter((s) => s.action === "like");
  const dislikes = swipes.filter((s) => s.action === "dislike");

  let topCategory: string | null = null;
  if (likes.length > 0) {
    const { data: catRows, error: catError } = await supabaseAdmin
      .from("memes")
      .select("id, category")
      .in(
        "id",
        likes.map((l) => l.meme_id),
      );
    if (catError) fail("Could not read meme categories", catError);
    const counts = new Map<string, number>();
    for (const row of catRows ?? []) {
      const c = row.category as string;
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    topCategory = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }

  const stats = {
    device_id: deviceId,
    total_swipes: swipes.length,
    likes_count: likes.length,
    dislikes_count: dislikes.length,
    saves_count: (savedRes.data ?? []).length,
    top_category: topCategory,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("user_statistics")
    .upsert(stats, { onConflict: "device_id" });
  if (error) fail("Could not update your statistics", error);

  const { device_id: _ignored, ...rest } = stats;
  return rest;
}

export async function readStatistics(deviceId: string): Promise<UserStatistics> {
  const { data, error } = await supabaseAdmin
    .from("user_statistics")
    .select("total_swipes, likes_count, dislikes_count, saves_count, top_category, updated_at")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (error) fail("Could not load your statistics", error);
  if (data) return data as UserStatistics;
  return recalculateStatistics(deviceId);
}

export type MatchingUser = {
  device_id: string;
  shared_likes: number;
  compatibility: number;
  top_category: string | null;
  likes_count: number;
};

/** Other devices whose likes overlap with this one. */
export async function getMatchingUsers(deviceId: string, limit = 10): Promise<MatchingUser[]> {
  const { data: myLikes, error: myError } = await supabaseAdmin
    .from("swipes")
    .select("meme_id")
    .eq("device_id", deviceId)
    .eq("action", "like");
  if (myError) fail("Could not read your likes", myError);

  const myIds = (myLikes ?? []).map((r) => r.meme_id as string);
  if (myIds.length === 0) return [];

  const { data: others, error: othersError } = await supabaseAdmin
    .from("swipes")
    .select("device_id, meme_id")
    .eq("action", "like")
    .in("meme_id", myIds)
    .neq("device_id", deviceId);
  if (othersError) fail("Could not find matching users", othersError);

  const shared = new Map<string, number>();
  for (const row of others ?? []) {
    const d = row.device_id as string;
    shared.set(d, (shared.get(d) ?? 0) + 1);
  }
  if (shared.size === 0) return [];

  const { data: statRows, error: statError } = await supabaseAdmin
    .from("user_statistics")
    .select("device_id, top_category, likes_count")
    .in("device_id", [...shared.keys()]);
  if (statError) fail("Could not load matching profiles", statError);

  const statsByDevice = new Map(
    (statRows ?? []).map((r) => [
      r.device_id as string,
      { top_category: r.top_category as string | null, likes_count: r.likes_count as number },
    ]),
  );

  return [...shared.entries()]
    .map(([device, count]) => {
      const s = statsByDevice.get(device);
      const union = myIds.length + (s?.likes_count ?? count) - count;
      return {
        device_id: device,
        shared_likes: count,
        compatibility: union > 0 ? Math.round((count / union) * 100) : 0,
        top_category: s?.top_category ?? null,
        likes_count: s?.likes_count ?? count,
      };
    })
    .sort((a, b) => b.compatibility - a.compatibility || b.shared_likes - a.shared_likes)
    .slice(0, limit);
}
