import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { Bookmark, Heart, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { MemeCard } from "@/components/MemeCard";
import { useMemeData } from "@/hooks/useMemeData";
import { recordSwipe, saveMeme, type Meme } from "@/lib/meme-api";
import { LIKES_TO_MATCH } from "@/lib/humor";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meme Tinder — Swipe Memes You Love" },
      {
        name: "description",
        content:
          "Swipe right to like, left to skip. Save your favourite Russian and English memes and unlock your humor match.",
      },
      { property: "og:title", content: "Meme Tinder — Swipe Memes You Love" },
      {
        property: "og:description",
        content:
          "Swipe right to like, left to skip. Save your favourite Russian and English memes and unlock your humor match.",
      },
    ],
  }),
  component: SwipePage,
});

const SWIPE_THRESHOLD = 110;

function SwipePage() {
  const queryClient = useQueryClient();
  const { deviceId, memes, swipes, saved, isLoading } = useMemeData();

  const [pending, setPending] = useState<string[]>([]);
  const [drag, setDrag] = useState(0);
  const [exit, setExit] = useState<"like" | "dislike" | null>(null);
  const startX = useRef<number | null>(null);

  const swipedIds = useMemo(
    () => new Set([...swipes.map((s) => s.meme_id), ...pending]),
    [swipes, pending],
  );
  const queue = useMemo(() => memes.filter((m) => !swipedIds.has(m.id)), [memes, swipedIds]);
  const current: Meme | undefined = queue[0];
  const next: Meme | undefined = queue[1];

  const likeCount = swipes.filter((s) => s.action === "like").length;
  const isSaved = current ? saved.includes(current.id) : false;

  const commit = useCallback(
    (meme: Meme, action: "like" | "dislike") => {
      setExit(action);
      window.setTimeout(() => {
        setPending((p) => [...p, meme.id]);
        setDrag(0);
        setExit(null);
        void recordSwipe(deviceId, meme.id, action)
          .then(() => {
            void queryClient.invalidateQueries({ queryKey: ["swipes", deviceId] });
          })
          .catch(() => toast.error("Couldn't save that swipe. Check your connection."));
      }, 220);
    },
    [deviceId, queryClient],
  );

  const handleSave = useCallback(() => {
    if (!current) return;
    void saveMeme(deviceId, current.id)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ["saved", deviceId] });
        toast.success("Saved to your collection");
      })
      .catch(() => toast.error("Couldn't save that meme."));
  }, [current, deviceId, queryClient]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!current || exit) return;
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    setDrag(e.clientX - startX.current);
  };
  const onPointerUp = () => {
    if (startX.current === null) return;
    const dx = drag;
    startX.current = null;
    if (!current) return;
    if (dx > SWIPE_THRESHOLD) commit(current, "like");
    else if (dx < -SWIPE_THRESHOLD) commit(current, "dislike");
    else setDrag(0);
  };

  const offset = exit === "like" ? 700 : exit === "dislike" ? -700 : drag;

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {likeCount} / {LIKES_TO_MATCH} likes to your match
          </p>
          <p className="text-muted-foreground">{queue.length} left</p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(100, (likeCount / LIKES_TO_MATCH) * 100)}%` }}
          />
        </div>

        {likeCount >= LIKES_TO_MATCH && (
          <Link
            to="/matches"
            className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-center text-sm font-semibold text-accent"
          >
            Your humor match is ready — see it →
          </Link>
        )}

        <div className="relative aspect-[3/4] w-full touch-pan-y select-none">
          {isLoading && (
            <div className="absolute inset-0 animate-pulse rounded-3xl border border-border bg-card" />
          )}

          {!isLoading && !current && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card px-6 text-center">
              <RotateCcw className="size-8 text-muted-foreground" />
              <h2 className="text-xl font-bold">You've seen them all</h2>
              <p className="text-sm text-muted-foreground">
                Check your saved memes, or reset your history from your profile to swipe again.
              </p>
              <Link
                to="/profile"
                className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Go to profile
              </Link>
            </div>
          )}

          {next && (
            <div className="absolute inset-0 scale-95 opacity-60">
              <MemeCard meme={next} />
            </div>
          )}

          {current && (
            <div
              className={cn("absolute inset-0 cursor-grab active:cursor-grabbing")}
              style={{
                transform: `translateX(${offset}px) rotate(${offset / 22}deg)`,
                transition: startX.current === null ? "transform 220ms ease-out" : "none",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <MemeCard meme={current} />
              <div
                className="pointer-events-none absolute top-6 left-6 rotate-[-12deg] rounded-lg border-4 border-success px-3 py-1 text-2xl font-extrabold text-success uppercase"
                style={{ opacity: Math.max(0, Math.min(1, offset / 100)) }}
              >
                Like
              </div>
              <div
                className="pointer-events-none absolute top-6 right-6 rotate-12 rounded-lg border-4 border-destructive px-3 py-1 text-2xl font-extrabold text-destructive uppercase"
                style={{ opacity: Math.max(0, Math.min(1, -offset / 100)) }}
              >
                Nope
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-5">
          <button
            aria-label="Dislike"
            disabled={!current}
            onClick={() => current && commit(current, "dislike")}
            className="grid size-16 place-items-center rounded-full border border-border bg-card text-destructive transition-transform hover:scale-105 disabled:opacity-40"
          >
            <X className="size-7" />
          </button>
          <button
            aria-label="Save"
            disabled={!current}
            onClick={handleSave}
            className={cn(
              "grid size-14 place-items-center rounded-full border border-border bg-card text-accent transition-transform hover:scale-105 disabled:opacity-40",
              isSaved && "bg-accent text-accent-foreground",
            )}
          >
            <Bookmark className={cn("size-6", isSaved && "fill-current")} />
          </button>
          <button
            aria-label="Like"
            disabled={!current}
            onClick={() => current && commit(current, "like")}
            className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:opacity-40"
          >
            <Heart className="size-7" />
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Drag the card right to like, left to skip — or use the buttons.
        </p>
      </div>
    </AppShell>
  );
}
