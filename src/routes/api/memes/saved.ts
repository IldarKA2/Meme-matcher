import { createFileRoute } from "@tanstack/react-router";
import { deviceIdSchema, json, jsonError, serverError } from "@/lib/api-http";

export const Route = createFileRoute("/api/memes/saved")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = deviceIdSchema.safeParse(url.searchParams.get("deviceId") ?? undefined);
        if (!parsed.success) {
          return jsonError("A valid deviceId query parameter is required.", 400);
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("saved_memes")
            .select(
              "created_at, memes ( id, template, lines, language, category, image_url, image_path )",
            )
            .eq("device_id", parsed.data)
            .order("created_at", { ascending: false });
          if (error) return serverError("GET /api/memes/saved", new Error(error.message));

          return json({
            memes: (data ?? []).map((r) => r.memes).filter((m): m is NonNullable<typeof m> => Boolean(m)),
          });
        } catch (error) {
          return serverError("GET /api/memes/saved", error);
        }
      },
    },
  },
});
