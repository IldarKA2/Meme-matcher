import { createFileRoute } from "@tanstack/react-router";
import { deviceIdSchema, json, jsonError, serverError } from "@/lib/api-http";

const LIKES_REQUIRED = 10;

export const Route = createFileRoute("/api/users/matches")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = deviceIdSchema.safeParse(url.searchParams.get("deviceId") ?? undefined);
        if (!parsed.success) {
          return jsonError("A valid deviceId query parameter is required.", 400);
        }

        try {
          const { touchUser, readStatistics, getMatchingUsers } = await import(
            "@/lib/meme.server"
          );
          await touchUser(parsed.data);
          const statistics = await readStatistics(parsed.data);
          if (statistics.likes_count < LIKES_REQUIRED) {
            return json({
              unlocked: false,
              currentLikes: statistics.likes_count,
              likesRequired: LIKES_REQUIRED,
              users: [],
            });
          }
          return json({
            unlocked: true,
            currentLikes: statistics.likes_count,
            likesRequired: LIKES_REQUIRED,
            users: await getMatchingUsers(parsed.data),
          });
        } catch (error) {
          return serverError("GET /api/users/matches", error);
        }
      },
    },
  },
});
