import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { MemeCard } from "@/components/MemeCard";
import { useMemeData } from "@/hooks/useMemeData";
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
    ],
  }),
  component: MatchesPage,
});

function MatchesPage() {
  const { memes, swipes, isLoading } = useMemeData();

  const likedMemes = swipes
    .filter((s) => s.action === "like")
    .map((s) => memes.find((m) => m.id === s.meme_id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const likeCount = swipes.filter((s) => s.action === "like").length;
  const unlocked = likeCount >= LIKES_TO_MATCH;
  const top = topCategory(likedMemes.map((m) => m.category));
  const personality = top ? PERSONALITIES[top] : undefined;
  const breakdown = categoryBreakdown(likedMemes.map((m) => m.category));

  if (isLoading) {
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
        <p className="mt-2 font-display text-lg text-accent">{personality?.tagline}</p>
        <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">
          {personality?.description}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Meme compatibility</h2>
        <ul className="mt-4 space-y-3">
          {breakdown.map((row) => (
            <li key={row.category}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{CATEGORY_LABELS[row.category] ?? row.category}</span>
                <span className="text-muted-foreground">{row.percent}% match</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary" style={{ width: `${row.percent}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Top memes you matched with</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {likedMemes
            .filter((m) => m.category === top)
            .slice(0, 6)
            .map((meme) => (
              <div key={meme.id} className="aspect-[3/4]">
                <MemeCard meme={meme} />
              </div>
            ))}
        </div>
      </section>
    </AppShell>
  );
}
