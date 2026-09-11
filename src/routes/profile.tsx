import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bookmark, Heart, Layers, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { useMemeData } from "@/hooks/useMemeData";
import { resetHistory } from "@/lib/meme-api";
import { CATEGORY_LABELS, LIKES_TO_MATCH, categoryBreakdown } from "@/lib/humor";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Meme Profile — Meme Tinder" },
      {
        name: "description",
        content: "See how many memes you swiped, liked, skipped and saved.",
      },
      { property: "og:title", content: "Your Meme Profile — Meme Tinder" },
      {
        property: "og:description",
        content: "See how many memes you swiped, liked, skipped and saved.",
      },
    ],
  }),
  component: ProfilePage,
});

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Heart;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon className={`mb-2 size-5 ${tone}`} />
      <p className="font-display text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function ProfilePage() {
  const queryClient = useQueryClient();
  const { deviceId, memes, swipes, saved } = useMemeData();

  const liked = swipes.filter((s) => s.action === "like");
  const disliked = swipes.filter((s) => s.action === "dislike");
  const likedCategories = liked
    .map((s) => memes.find((m) => m.id === s.meme_id)?.category)
    .filter((c): c is string => Boolean(c));
  const breakdown = categoryBreakdown(likedCategories);

  const reset = () => {
    void resetHistory(deviceId)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ["swipes", deviceId] });
        void queryClient.invalidateQueries({ queryKey: ["saved", deviceId] });
        toast.success("History cleared — the whole deck is back");
      })
      .catch(() => toast.error("Couldn't reset your history."));
  };

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">Your profile</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Stats are stored for this browser — no account needed.
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total swiped" value={swipes.length} icon={Layers} tone="text-foreground" />
        <Stat label="Liked" value={liked.length} icon={Heart} tone="text-primary" />
        <Stat label="Disliked" value={disliked.length} icon={X} tone="text-destructive" />
        <Stat label="Saved" value={saved.length} icon={Bookmark} tone="text-accent" />
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold">Your taste</h2>
        {breakdown.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Like a few memes and your humor breakdown will appear here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {breakdown.map((row) => (
              <li key={row.category}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{CATEGORY_LABELS[row.category] ?? row.category}</span>
                  <span className="text-muted-foreground">{row.percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-accent" style={{ width: `${row.percent}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/matches"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            {liked.length >= LIKES_TO_MATCH
              ? "See your match"
              : `${LIKES_TO_MATCH - liked.length} likes to your match`}
          </Link>
          <button
            onClick={reset}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-destructive"
          >
            Reset history
          </button>
        </div>
      </section>
    </AppShell>
  );
}
