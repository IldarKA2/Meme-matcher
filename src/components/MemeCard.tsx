import { memeImageUrl, type Meme } from "@/lib/meme-api";
import { cn } from "@/lib/utils";

export function MemeCard({ meme, className }: { meme: Meme; className?: string }) {
  return (
    <div
      className={cn(
        "deck-card-shadow relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-border bg-card",
        className,
      )}
    >
      <div className="relative flex-1 overflow-hidden bg-image-stage">
        <img
          src={memeImageUrl(meme)}
          alt={meme.lines.join(" — ") || `Meme from the ${meme.category} collection`}
          draggable={false}
          loading="lazy"
          className="h-full w-full object-contain select-none"
        />
      </div>
      <div className="grid min-h-12 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-t border-border px-4 py-2 text-xs">
        <span className="shrink-0 rounded-md bg-secondary px-2.5 py-1 font-bold text-secondary-foreground uppercase">
          {meme.language === "ru" ? "RU" : "EN"}
        </span>
        <span className="truncate text-right font-medium text-muted-foreground capitalize">
          {meme.category}
        </span>
      </div>
    </div>
  );
}
