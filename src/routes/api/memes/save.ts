import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  deviceIdSchema,
  json,
  jsonError,
  memeIdSchema,
  readJsonBody,
  serverError,
} from "@/lib/api-http";

const bodySchema = z.object({ deviceId: deviceIdSchema, memeId: memeIdSchema });

async function parseBody(request: Request) {
  const raw = await readJsonBody(request);
  return bodySchema.safeParse(raw);
}

export const Route = createFileRoute("/api/memes/save")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = await parseBody(request);
        if (!parsed.success) return jsonError("Body must be { deviceId, memeId }.", 400);

        try {
          const { touchUser, recalculateStatistics, getMemeById } = await import(
            "@/lib/meme.server"
          );
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          await touchUser(parsed.data.deviceId);
          if (!(await getMemeById(parsed.data.memeId))) {
            return jsonError("Meme not found.", 404);
          }

          const { error } = await supabaseAdmin
            .from("saved_memes")
            .upsert(
              { device_id: parsed.data.deviceId, meme_id: parsed.data.memeId },
              { onConflict: "device_id,meme_id" },
            );
          if (error) return serverError("POST /api/memes/save", new Error(error.message));

          return json({
            success: true,
            statistics: await recalculateStatistics(parsed.data.deviceId),
          });
        } catch (error) {
          return serverError("POST /api/memes/save", error);
        }
      },
      DELETE: async ({ request }) => {
        const parsed = await parseBody(request);
        if (!parsed.success) return jsonError("Body must be { deviceId, memeId }.", 400);

        try {
          const { recalculateStatistics } = await import("@/lib/meme.server");
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { error } = await supabaseAdmin
            .from("saved_memes")
            .delete()
            .eq("device_id", parsed.data.deviceId)
            .eq("meme_id", parsed.data.memeId);
          if (error) return serverError("DELETE /api/memes/save", new Error(error.message));

          return json({
            success: true,
            statistics: await recalculateStatistics(parsed.data.deviceId),
          });
        } catch (error) {
          return serverError("DELETE /api/memes/save", error);
        }
      },
    },
  },
});
