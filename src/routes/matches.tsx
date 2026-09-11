import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lock, Share2, Users } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { MemeCard } from "@/components/MemeCard";
import { Button } from "@/components/ui/button";
import { useLikedMemes, useMatchingUsers, useStatistics } from "@/hooks/useMemeData";
import { memeImageUrl } from "@/lib/meme-api";
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

  const inviteFriends = async () => {
    const invitation = {
      title: "Meme Tinder",
      text: "Swipe some memes and compare your humor match with me.",
      url: window.location.origin,
    };
    if (navigator.share) {
      await navigator.share(invitation).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(window.location.origin).catch(() => undefined);
  };

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

      <section className="mt-8">
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
          <div className="mt-4 rounded-xl border border-dashed border-border bg-card p-6 text-center">
            <p className="font-semibold">Your humor twin is still out there</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Nobody shares your favorites yet. Keep swiping or invite friends to compare tastes.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/">Keep swiping <ArrowRight /></Link>
              </Button>
              <Button variant="outline" onClick={inviteFriends}>
                <Share2 /> Invite friends
              </Button>
            </div>
          </div>
        )}
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {users.map((u, i) => (
            <li
              key={u.device_id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary font-display text-sm font-bold text-secondary-foreground">
                    {u.device_id.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">Meme fan {u.device_id.slice(-4)}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.shared_likes} shared favorite{u.shared_likes === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-primary/15 px-3 py-1 text-sm font-bold text-primary">
                  {u.compatibility}% Match
                </span>
              </div>
              <div className="mt-4 flex gap-2" aria-label="Shared favorite memes">
                {u.shared_memes.slice(0, 3).map((meme) => (
                  <img
                    key={meme.id}
                    src={memeImageUrl(meme, 240)}
                    alt={meme.lines.join(" — ") || "Shared meme"}
                    className="aspect-square min-w-0 flex-1 rounded-md border border-border object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
              {u.top_category && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Loves {CATEGORY_LABELS[u.top_category] ?? u.top_category}
                  {u.top_category
                    ? " humor"
                    : ""}
                </p>
              )}
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
