import { createFileRoute } from "@tanstack/react-router";
import { jsonError } from "@/lib/api-http";


/**
 * Server-side proxy for the external meme image service.
 * The browser never talks to the third-party API directly.
 */
export const Route = createFileRoute("/api/public/meme-image/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const id = params.id;
        if (!/^[0-9a-f-]{36}$/i.test(id)) {
          return jsonError("Invalid meme id.", 400);
        }

        const url = new URL(request.url);
        const parsedWidth = Number(url.searchParams.get("width") ?? "600");
        const width = Number.isFinite(parsedWidth)
          ? Math.min(1200, Math.max(200, Math.round(parsedWidth)))
          : 600;

        try {
          const { getMemeById, imageSource } = await import("@/lib/meme.server");
          const meme = await getMemeById(id);
          if (!meme) return jsonError("Meme not found.", 404);

          const source = imageSource(meme, width);
          const upstream = await fetch(source.url, { headers: source.headers });
          if (!upstream.ok || !upstream.body) {
            console.error("[meme-image] upstream returned", upstream.status);
            return jsonError("Image temporarily unavailable.", 502);
          }

          return new Response(upstream.body, {
            status: 200,
            headers: {
              "content-type": upstream.headers.get("content-type") ?? "image/png",
              "cache-control": "public, max-age=86400",
            },
          });
        } catch (error) {
          console.error("[meme-image]", error);
          return jsonError("Image temporarily unavailable.", 502);
        }
      },
    },
  },
});
