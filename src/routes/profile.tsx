import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bookmark, Heart, Layers, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { useLikedMemes, useRefreshMemeData, useStatistics } from "@/hooks/useMemeData";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const { deviceId, stats, error } = useStatistics();
  const { liked } = useLikedMemes();
  const refresh = useRefreshMemeData(deviceId);
  const resetFn = useServerFn(resetHistory);

  const breakdown = categoryBreakdown(liked.map((m) => m.category));

  const reset = () => {
    void resetFn({ data: { deviceId } })
      .then(() => {
        refresh();
        toast.success("History cleared — the whole deck is back");
      })
      .catch((e: unknown) =>
        toast.error(e instanceof Error ? e.message : "Couldn't reset your history."),
      );
  };

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">Your profile</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Stats are stored for this browser — no account needed.
      </p>

      {error && (
        <p className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          We couldn't load your statistics. Please refresh the page.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Total swiped"
          value={stats.total_swipes}
          icon={Layers}
          tone="text-foreground"
        />
        <Stat label="Liked" value={stats.likes_count} icon={Heart} tone="text-primary" />
        <Stat label="Disliked" value={stats.dislikes_count} icon={X} tone="text-destructive" />
        <Stat label="Saved" value={stats.saves_count} icon={Bookmark} tone="text-accent" />
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
            {stats.likes_count >= LIKES_TO_MATCH
              ? "See your match"
              : `${LIKES_TO_MATCH - stats.likes_count} likes to your match`}
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
