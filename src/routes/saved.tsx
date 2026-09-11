import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { MemeCard } from "@/components/MemeCard";
import { useMemeData } from "@/hooks/useMemeData";
import { unsaveMeme } from "@/lib/meme-api";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Memes — Meme Tinder" },
      { name: "description", content: "Every meme you bookmarked while swiping, in one place." },
      { property: "og:title", content: "Saved Memes — Meme Tinder" },
      {
        property: "og:description",
        content: "Every meme you bookmarked while swiping, in one place.",
      },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const queryClient = useQueryClient();
  const { deviceId, memes, saved, isLoading } = useMemeData();
  const savedMemes = saved
    .map((id) => memes.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const remove = (id: string) => {
    void unsaveMeme(deviceId, id)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ["saved", deviceId] });
        toast.success("Removed from saved");
      })
      .catch(() => toast.error("Couldn't remove that meme."));
  };

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">Saved memes</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {savedMemes.length} meme{savedMemes.length === 1 ? "" : "s"} in your collection
      </p>

      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-card" />
          ))}
        </div>
      )}

      {!isLoading && savedMemes.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <h2 className="text-lg font-bold">Nothing saved yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tap the bookmark button while swiping to keep a meme forever.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Start swiping
          </Link>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {savedMemes.map((meme) => (
          <div key={meme.id} className="flex flex-col gap-2">
            <div className="aspect-[3/4]">
              <MemeCard meme={meme} />
            </div>
            <button
              onClick={() => remove(meme.id)}
              className="flex items-center justify-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="size-4" /> Remove
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
