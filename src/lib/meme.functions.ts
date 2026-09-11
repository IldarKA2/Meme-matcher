import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const deviceSchema = z.object({ deviceId: z.string().min(8).max(100) });
const swipeSchema = deviceSchema.extend({
  memeId: z.string().uuid(),
  action: z.enum(["like", "dislike"]),
});
const memeSchema = deviceSchema.extend({ memeId: z.string().uuid() });
const deckSchema = deviceSchema.extend({ count: z.number().int().min(1).max(20).default(3) });

/** GET a random meme (or a few) the user has not swiped yet. */
export const getRandomMeme = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => deckSchema.parse(data))
  .handler(async ({ data }) => {
    const { touchUser, getRandomMemes } = await import("./meme.server");
    await touchUser(data.deviceId);
    const { memes, remaining } = await getRandomMemes(data.deviceId, data.count);
    return { memes, remaining, exhausted: memes.length === 0 };
  });

/** POST a like/dislike and refresh the user's statistics. */
export const recordSwipe = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => swipeSchema.parse(data))
  .handler(async ({ data }) => {
    const { touchUser, recalculateStatistics, getMemeById } = await import("./meme.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await touchUser(data.deviceId);
    if (!(await getMemeById(data.memeId))) throw new Error("That meme no longer exists.");

    const { error } = await supabaseAdmin
      .from("swipes")
      .upsert(
        { device_id: data.deviceId, meme_id: data.memeId, action: data.action },
        { onConflict: "device_id,meme_id" },
      );
    if (error) {
      console.error("[recordSwipe]", error.message);
      throw new Error("Could not save that swipe. Please try again.");
    }
    return { statistics: await recalculateStatistics(data.deviceId) };
  });

/** POST save a meme and refresh statistics. */
export const saveMeme = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => memeSchema.parse(data))
  .handler(async ({ data }) => {
    const { touchUser, recalculateStatistics, getMemeById } = await import("./meme.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await touchUser(data.deviceId);
    if (!(await getMemeById(data.memeId))) throw new Error("That meme no longer exists.");

    const { error } = await supabaseAdmin
      .from("saved_memes")
      .upsert(
        { device_id: data.deviceId, meme_id: data.memeId },
        { onConflict: "device_id,meme_id" },
      );
    if (error) {
      console.error("[saveMeme]", error.message);
      throw new Error("Could not save that meme. Please try again.");
    }
    return { statistics: await recalculateStatistics(data.deviceId) };
  });

/** POST remove a saved meme. */
export const unsaveMeme = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => memeSchema.parse(data))
  .handler(async ({ data }) => {
    const { recalculateStatistics } = await import("./meme.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("saved_memes")
      .delete()
      .eq("device_id", data.deviceId)
      .eq("meme_id", data.memeId);
    if (error) {
      console.error("[unsaveMeme]", error.message);
      throw new Error("Could not remove that meme. Please try again.");
    }
    return { statistics: await recalculateStatistics(data.deviceId) };
  });

/** GET every saved meme for the current device. */
export const getSavedMemes = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => deviceSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("saved_memes")
      .select("created_at, memes ( id, template, lines, language, category )")
      .eq("device_id", data.deviceId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[getSavedMemes]", error.message);
      throw new Error("Could not load your saved memes.");
    }
    return {
      memes: (rows ?? [])
        .map((r) => r.memes)
        .filter((m): m is NonNullable<typeof m> => Boolean(m)),
    };
  });

/** GET persisted statistics for the current device. */
export const getUserStatistics = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => deviceSchema.parse(data))
  .handler(async ({ data }) => {
    const { touchUser, readStatistics } = await import("./meme.server");
    await touchUser(data.deviceId);
    return { statistics: await readStatistics(data.deviceId) };
  });

/** GET the liked memes of the current device (used for the humour breakdown). */
export const getLikedMemes = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => deviceSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("swipes")
      .select("created_at, memes ( id, template, lines, language, category )")
      .eq("device_id", data.deviceId)
      .eq("action", "like")
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[getLikedMemes]", error.message);
      throw new Error("Could not load your liked memes.");
    }
    return {
      memes: (rows ?? [])
        .map((r) => r.memes)
        .filter((m): m is NonNullable<typeof m> => Boolean(m)),
    };
  });

/** GET other users whose taste overlaps with the current device. */
export const getMatchingUsers = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => deviceSchema.parse(data))
  .handler(async ({ data }) => {
    const { getMatchingUsers: findMatches } = await import("./meme.server");
    return { users: await findMatches(data.deviceId) };
  });

/** POST clear all swipes and saves for this device. */
export const resetHistory = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => deviceSchema.parse(data))
  .handler(async ({ data }) => {
    const { recalculateStatistics } = await import("./meme.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const a = await supabaseAdmin.from("swipes").delete().eq("device_id", data.deviceId);
    const b = await supabaseAdmin.from("saved_memes").delete().eq("device_id", data.deviceId);
    if (a.error || b.error) {
      console.error("[resetHistory]", a.error?.message ?? b.error?.message);
      throw new Error("Could not reset your history. Please try again.");
    }
    return { statistics: await recalculateStatistics(data.deviceId) };
  });
