import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { deviceIdSchema, json, jsonError, serverError } from "@/lib/api-http";

const querySchema = z.object({
  deviceId: deviceIdSchema,
  count: z.coerce.number().int().min(1).max(20).default(3),
});

export const Route = createFileRoute("/api/memes/random")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = querySchema.safeParse({
          deviceId: url.searchParams.get("deviceId") ?? undefined,
          count: url.searchParams.get("count") ?? undefined,
        });
        if (!parsed.success) {
          return jsonError("A valid deviceId query parameter is required.", 400);
        }

        try {
          const { touchUser, getRandomMemes } = await import("@/lib/meme.server");
          await touchUser(parsed.data.deviceId);
          const { memes, remaining } = await getRandomMemes(
            parsed.data.deviceId,
            parsed.data.count,
          );
          return json({ memes, remaining, exhausted: memes.length === 0 });
        } catch (error) {
          return serverError("GET /api/memes/random", error);
        }
      },
    },
  },
});
