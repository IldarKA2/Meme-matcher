export const LIKES_TO_MATCH = 10;

export type Category = "relatable" | "work" | "nerd" | "absurd" | "wholesome" | "dark";

type Personality = {
  title: string;
  emoji: string;
  tagline: string;
  description: string;
};

export const CATEGORY_LABELS: Record<string, string> = {
  relatable: "Relatable",
  work: "Office life",
  nerd: "Nerdy",
  absurd: "Absurd",
  wholesome: "Wholesome",
  dark: "Deadpan",
};

export const PERSONALITIES: Record<string, Personality> = {
  relatable: {
    title: "The Mirror Holder",
    emoji: "🪞",
    tagline: "You laugh because it is literally you.",
    description:
      "Your humor lives in everyday chaos: snoozed alarms, one more episode, and promises made to a future self who never showed up.",
  },
  work: {
    title: "The Meeting Survivor",
    emoji: "☕",
    tagline: "This could have been an email.",
    description:
      "Deadlines, stand-ups and Friday deploys are your comedy fuel. You find peace in shared workplace suffering.",
  },
  nerd: {
    title: "The Cache Miss",
    emoji: "🧠",
    tagline: "It works on your machine.",
    description:
      "Niche references, tabs that never close, and jokes that need two seconds of thinking. You like humor with a footnote.",
  },
  absurd: {
    title: "The Chaos Gremlin",
    emoji: "🌀",
    tagline: "Logic left the chat.",
    description:
      "The stranger the better. Your ideal meme has no punchline, no context, and somehow still lands perfectly.",
  },
  wholesome: {
    title: "The Soft Serve",
    emoji: "🐾",
    tagline: "Cats, snacks and gentle nonsense.",
    description:
      "You go for warmth over edge. Your feed is animals, tiny wins, and jokes nobody has to apologise for.",
  },
  dark: {
    title: "The Straight Face",
    emoji: "🔥",
    tagline: "Everything is fine, obviously.",
    description:
      "Deadpan, dry and slightly doomed. You laugh at the flames with the calm of someone who has seen worse.",
  },
};

export function topCategory(categories: string[]): string | null {
  if (categories.length === 0) return null;
  const counts = new Map<string, number>();
  for (const c of categories) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0];
}

export function categoryBreakdown(categories: string[]) {
  const counts = new Map<string, number>();
  for (const c of categories) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts.entries()]
    .map(([category, count]) => ({
      category,
      count,
      percent: Math.round((count / categories.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}
