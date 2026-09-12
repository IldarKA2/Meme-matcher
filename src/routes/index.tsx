import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, Heart, RefreshCw, RotateCcw, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { MemeCard } from "@/components/MemeCard";
import { Button } from "@/components/ui/button";
import {
  useDeck,
  useOptimisticStats,
  useRefreshMemeData,
  useSavedMemes,
  useStatistics,
} from "@/hooks/useMemeData";
import {
  recordSwipe,
  resetHistory,
  saveMeme,
  unsaveMeme,
  type Meme,
} from "@/lib/meme-api";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SwipePage,
});

const SWIPE_THRESHOLD = 110;
const EXIT_DISTANCE = 720;

function SwipePage() {
  const { deviceId, deck, remaining, isLoading, isFetching, error, retry } = useDeck();
  const { saved } = useSavedMemes();
  const { stats } = useStatistics();
  const refresh = useRefreshMemeData(deviceId);

  const swipeFn = useServerFn(recordSwipe);
  const saveFn = useServerFn(saveMeme);
  const unsaveFn = useServerFn(unsaveMeme);
  const resetFn = useServerFn(resetHistory);

  const [consumed, setConsumed] = useState<string[]>([]);
  const [drag, setDrag] = useState(0);
  const [exit, setExit] = useState<"like" | "dislike" | null>(null);
  const [saveOverride, setSaveOverride] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const startX = useRef<number | null>(null);
  const dragRef = useRef(0);

  const queue = useMemo(
    () => deck.filter((m) => !consumed.includes(m.id)),
    [deck, consumed],
  );
  const current: Meme | undefined = queue[0];
  const next: Meme | undefined = queue[1];

  const likeCount = stats.likes_count;
  const storedSaved = current ? saved.some((m) => m.id === current.id) : false;
  const isSaved = saveOverride ?? storedSaved;

  useEffect(() => {
    setSaveOverride(null);
  }, [current?.id]);

  const commit = useCallback(
    (meme: Meme, action: "like" | "dislike") => {
      if (!deviceId || exit) return;
      setExit(action);
      dragRef.current = action === "like" ? SWIPE_THRESHOLD : -SWIPE_THRESHOLD;
      window.setTimeout(() => {
        setConsumed((c) => [...c, meme.id]);
        setDrag(0);
        dragRef.current = 0;
        setExit(null);
        void swipeFn({ data: { deviceId, memeId: meme.id, action } })
          .then(() => refresh())
          .catch((e: unknown) =>
            toast.error(e instanceof Error ? e.message : "Couldn't save that swipe."),
          );
      }, 220);
    },
    [deviceId, exit, refresh, swipeFn],
  );

  const handleSave = useCallback(() => {
    if (!current || !deviceId || isSaving) return;
    const nextSaved = !isSaved;
    setIsSaving(true);
    setSaveOverride(nextSaved);
    const mutation = nextSaved ? saveFn : unsaveFn;
    void mutation({ data: { deviceId, memeId: current.id } })
      .then(() => {
        refresh();
        toast.success(nextSaved ? "Saved to your collection" : "Removed from saved");
      })
      .catch((e: unknown) => {
        setSaveOverride(!nextSaved);
        toast.error(e instanceof Error ? e.message : "Couldn't update that meme.");
      })
      .finally(() => setIsSaving(false));
  }, [current, deviceId, isSaved, isSaving, refresh, saveFn, unsaveFn]);

  const handleReset = useCallback(() => {
    if (!deviceId || isResetting) return;
    setIsResetting(true);
    void resetFn({ data: { deviceId } })
      .then(() => {
        setConsumed([]);
        refresh();
        toast.success("Fresh deck ready");
      })
      .catch((e: unknown) =>
        toast.error(e instanceof Error ? e.message : "Couldn't reset your deck."),
      )
      .finally(() => setIsResetting(false));
  }, [deviceId, isResetting, refresh, resetFn]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!current || exit) return;
    startX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const nextDrag = e.clientX - startX.current;
    dragRef.current = nextDrag;
    setDrag(nextDrag);
  };
  const onPointerUp = () => {
    if (startX.current === null) return;
    const dx = dragRef.current;
    startX.current = null;
    if (!current) return;
    if (dx > SWIPE_THRESHOLD) commit(current, "like");
    else if (dx < -SWIPE_THRESHOLD) commit(current, "dislike");
    else {
      dragRef.current = 0;
      setDrag(0);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowLeft" && current) {
        event.preventDefault();
        commit(current, "dislike");
      } else if (event.key === "ArrowRight" && current) {
        event.preventDefault();
        commit(current, "like");
      } else if (event.key.toLowerCase() === "s" && current) {
        event.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commit, current, handleSave]);

  const offset = exit === "like" ? EXIT_DISTANCE : exit === "dislike" ? -EXIT_DISTANCE : drag;
  const left = Math.max(0, remaining - consumed.length);
  const dragStrength = Math.min(1, Math.abs(offset) / SWIPE_THRESHOLD);
  const nextScale = 0.94 + dragStrength * 0.04;

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-md flex-col gap-3 sm:gap-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 text-sm">
          <p className="min-w-0 truncate font-medium text-muted-foreground">
            <span className="font-bold text-foreground">{likeCount}</span> / {LIKES_TO_MATCH} likes to match
          </p>
          <p className="shrink-0 font-medium text-muted-foreground">{left} left</p>
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

        <div className="relative aspect-[3/4] w-full select-none sm:max-h-[62vh]">
          {isLoading && (
            <div className="absolute inset-0" aria-label="Loading memes" role="status">
              <div className="absolute inset-x-7 inset-y-0 translate-y-4 scale-90 rounded-3xl bg-muted/40" />
              <div className="absolute inset-x-3 inset-y-0 translate-y-2 scale-95 rounded-3xl border border-border bg-secondary/70" />
              <div className="absolute inset-0 overflow-hidden rounded-3xl border border-border bg-card">
                <div className="h-[calc(100%-3rem)] animate-pulse bg-muted" />
                <div className="flex h-12 items-center justify-between px-4">
                  <span className="h-5 w-10 animate-pulse rounded-md bg-secondary" />
                  <span className="h-3 w-16 animate-pulse rounded bg-secondary" />
                </div>
              </div>
            </div>
          )}

          {!isLoading && error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl border border-destructive/40 bg-card px-8 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
                <RefreshCw className="size-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold">The deck didn’t load</h2>
                <p className="mt-2 text-sm text-muted-foreground">Your swipes are safe. Try loading the cards again.</p>
              </div>
              <Button onClick={() => void retry()} disabled={isFetching} className="rounded-full">
                <RefreshCw className={cn(isFetching && "animate-spin")} />
                {isFetching ? "Trying again…" : "Try again"}
              </Button>
            </div>
          )}

          {!isLoading && !current && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card px-7 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-accent/10 text-accent">
                <Sparkles className="size-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold">Deck finished</h2>
                <p className="mt-2 text-sm text-muted-foreground">No more memes for now. See what your taste unlocked or start fresh.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild className="rounded-full"><Link to="/matches">View matches</Link></Button>
                <Button asChild variant="secondary" className="rounded-full"><Link to="/saved">Saved memes</Link></Button>
                <Button variant="outline" className="rounded-full" onClick={handleReset} disabled={isResetting}>
                  <RotateCcw className={cn(isResetting && "animate-spin")} />
                  {isResetting ? "Resetting…" : "Reset swipes"}
                </Button>
              </div>
            </div>
          )}

          {next && (
            <div
              className="absolute inset-x-3 inset-y-0 translate-y-2 opacity-70 transition-transform duration-200 ease-out"
              style={{ transform: `translateY(8px) scale(${nextScale})` }}
              aria-hidden="true"
            >
              <MemeCard meme={next} />
            </div>
          )}

          {current && (
            <div
              className={cn("absolute inset-0 touch-pan-y cursor-grab active:cursor-grabbing")}
              style={{
                transform: `translate3d(${offset}px, ${Math.min(12, Math.abs(offset) / 18)}px, 0) rotate(${offset / 24}deg)`,
                transition: startX.current === null ? "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <MemeCard meme={current} />
              <div
                className="pointer-events-none absolute top-7 left-7 rotate-[-12deg] rounded-lg border-4 border-success px-4 py-1 font-display text-3xl font-bold text-success uppercase"
                style={{ opacity: Math.max(0, Math.min(1, offset / 90)) }}
              >
                Like
              </div>
              <div
                className="pointer-events-none absolute top-7 right-7 rotate-12 rounded-lg border-4 border-destructive px-4 py-1 font-display text-3xl font-bold text-destructive uppercase"
                style={{ opacity: Math.max(0, Math.min(1, -offset / 90)) }}
              >
                Nope
              </div>
            </div>
          )}
        </div>

        <div className="mx-auto grid w-full max-w-xs grid-cols-3 items-center justify-items-center gap-5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Dislike"
            title="Dislike (Left arrow)"
            disabled={!current}
            onClick={() => current && commit(current, "dislike")}
            className="deck-control-shadow size-16 rounded-full bg-card text-destructive transition-[transform,background-color] hover:scale-105 hover:bg-destructive/10 active:scale-90 [&_svg]:size-7"
          >
            <X />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={isSaved ? "Remove from saved" : "Save"}
            aria-pressed={isSaved}
            title={isSaved ? "Remove from saved (S)" : "Save (S)"}
            disabled={!current}
            onClick={handleSave}
            className={cn(
              "deck-control-shadow size-14 rounded-full bg-card text-accent transition-[transform,background-color] hover:scale-105 hover:bg-accent/10 active:scale-90 [&_svg]:size-6",
              isSaved && "border-accent bg-accent text-accent-foreground hover:bg-accent/90",
            )}
          >
            <Bookmark className={cn(isSaved && "fill-current")} />
          </Button>
          <Button
            type="button"
            size="icon"
            aria-label="Like"
            title="Like (Right arrow)"
            disabled={!current}
            onClick={() => current && commit(current, "like")}
            className="deck-control-shadow size-16 rounded-full transition-transform hover:scale-105 active:scale-90 [&_svg]:size-7"
          >
            <Heart className="fill-current" />
          </Button>
        </div>

        <p className="hidden text-center text-xs text-muted-foreground sm:block">
          <kbd>←</kbd> skip · <kbd>S</kbd> save · <kbd>→</kbd> like
        </p>
      </div>
    </AppShell>
  );
}
