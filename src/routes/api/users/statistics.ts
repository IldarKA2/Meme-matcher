import { createFileRoute } from "@tanstack/react-router";
import { deviceIdSchema, json, jsonError, serverError } from "@/lib/api-http";

export const Route = createFileRoute("/api/users/statistics")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = deviceIdSchema.safeParse(url.searchParams.get("deviceId") ?? undefined);
        if (!parsed.success) {
          return jsonError("A valid deviceId query parameter is required.", 400);
        }

        try {
          const { touchUser, readStatistics } = await import("@/lib/meme.server");
          await touchUser(parsed.data);
          return json({ statistics: await readStatistics(parsed.data) });
        } catch (error) {
          return serverError("GET /api/users/statistics", error);
        }
      },
    },
  },
});
