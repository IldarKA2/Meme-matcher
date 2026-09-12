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

const bodySchema = z.object({
  deviceId: deviceIdSchema,
  memeId: memeIdSchema,
  action: z.enum(["like", "dislike"]),
});

export const Route = createFileRoute("/api/swipes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await readJsonBody(request);
        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) {
          return jsonError("Body must be { deviceId, memeId, action: 'like'|'dislike' }.", 400);
        }

        try {
          const { touchUser, recalculateStatistics, getMemeById } = await import(
            "@/lib/meme.server"
          );
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          await touchUser(parsed.data.deviceId);
          if (!(await getMemeById(parsed.data.memeId))) {
            return jsonError("Meme not found.", 404);
          }

          const { error } = await supabaseAdmin.from("swipes").upsert(
            {
              device_id: parsed.data.deviceId,
              meme_id: parsed.data.memeId,
              action: parsed.data.action,
            },
            { onConflict: "device_id,meme_id" },
          );
          if (error) return serverError("POST /api/swipes", new Error(error.message));

          return json({ success: true, statistics: await recalculateStatistics(parsed.data.deviceId) });
        } catch (error) {
          return serverError("POST /api/swipes", error);
        }
      },
    },
  },
});
