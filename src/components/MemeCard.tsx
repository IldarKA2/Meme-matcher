import { memeImageUrl, type Meme } from "@/lib/meme-api";
import { cn } from "@/lib/utils";

export function MemeCard({ meme, className }: { meme: Meme; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl",
        className,
      )}
    >
      <div className="relative flex-1 overflow-hidden bg-black">
        <img
          src={memeImageUrl(meme)}
          alt={meme.lines.join(" — ") || "Meme"}
          draggable={false}
          loading="lazy"
          className="h-full w-full object-contain select-none"
        />
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2 text-xs">
        <span className="rounded-full bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground uppercase">
          {meme.language === "ru" ? "RU" : "EN"}
        </span>
        <span className="text-muted-foreground capitalize">{meme.category}</span>
      </div>
    </div>
  );
}
