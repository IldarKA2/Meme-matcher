import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Users } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { MemeCard } from "@/components/MemeCard";
import { useLikedMemes, useMatchingUsers, useStatistics } from "@/hooks/useMemeData";
import {
  CATEGORY_LABELS,
  LIKES_TO_MATCH,
  PERSONALITIES,
  categoryBreakdown,
  topCategory,
} from "@/lib/humor";

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "Your Humor Match — Meme Tinder" },
      {
        name: "description",
        content: "Like 10 memes to unlock your meme compatibility personality and top matches.",
      },
      { property: "og:title", content: "Your Humor Match — Meme Tinder" },
      {
        property: "og:description",
        content: "Like 10 memes to unlock your meme compatibility personality and top matches.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MatchesPage,
});

function MatchesPage() {
  const { stats, isLoading: statsLoading } = useStatistics();
  const { liked, isLoading: likedLoading } = useLikedMemes();

  const likeCount = stats.likes_count;
  const unlocked = likeCount >= LIKES_TO_MATCH;
  const { users, isLoading: usersLoading } = useMatchingUsers(unlocked);

  const top = stats.top_category ?? topCategory(liked.map((m) => m.category));
  const personality = top ? PERSONALITIES[top] : undefined;
  const breakdown = categoryBreakdown(liked.map((m) => m.category));

  if (statsLoading || likedLoading) {
    return (
      <AppShell>
        <div className="h-64 animate-pulse rounded-3xl bg-card" />
      </AppShell>
    );
  }

  if (!unlocked) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <Lock className="mx-auto size-8 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Match locked</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Like {LIKES_TO_MATCH - likeCount} more meme
            {LIKES_TO_MATCH - likeCount === 1 ? "" : "s"} and we'll reveal your humor personality.
          </p>
          <div className="mx-auto mt-5 h-2 w-full max-w-xs overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(likeCount / LIKES_TO_MATCH) * 100}%` }}
            />
          </div>
          <Link
            to="/"
            className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Keep swiping
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="rounded-3xl border border-primary/40 bg-gradient-to-b from-primary/15 to-transparent p-6 text-center sm:p-10">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Your humor match
        </p>
        <p className="mt-3 text-5xl">{personality?.emoji}</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{personality?.title}</h1>
        <p className="mt-2 text-sm font-semibold text-accent">{personality?.tagline}</p>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
          {personality?.description}
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold">Compatibility breakdown</h2>
        <ul className="mt-4 space-y-3">
          {breakdown.map((row) => (
            <li key={row.category}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{CATEGORY_LABELS[row.category] ?? row.category}</span>
                <span className="text-muted-foreground">{row.percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary" style={{ width: `${row.percent}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-accent" />
          <h2 className="text-lg font-bold">People who laugh like you</h2>
        </div>
        {usersLoading && <p className="mt-3 text-sm text-muted-foreground">Looking for matches…</p>}
        {!usersLoading && users.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Nobody else has liked the same memes yet. Check back once more people swipe.
          </p>
        )}
        <ul className="mt-4 space-y-3">
          {users.map((u, i) => (
            <li
              key={u.device_id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
            >
              <div>
                <p className="font-semibold">Swiper #{i + 1}</p>
                <p className="text-xs text-muted-foreground">
                  {u.shared_likes} shared like{u.shared_likes === 1 ? "" : "s"}
                  {u.top_category
                    ? ` · loves ${CATEGORY_LABELS[u.top_category] ?? u.top_category}`
                    : ""}
                </p>
              </div>
              <span className="font-display text-xl font-bold text-primary">
                {u.compatibility}%
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">Memes you loved</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {liked.slice(0, 6).map((meme) => (
            <div key={meme.id} className="aspect-[3/4]">
              <MemeCard meme={meme} />
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
