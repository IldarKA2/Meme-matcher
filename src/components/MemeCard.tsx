import type { Meme } from "@/lib/meme-api";
import { cn } from "@/lib/utils";

export function MemeCaption({ text, className }: { text: string; className?: string }) {
  if (!text) return null;
  return (
    <p
      className={cn(
        "meme-caption px-3 text-center text-lg leading-tight font-extrabold tracking-tight uppercase sm:text-2xl",
        className,
      )}
    >
      {text}
    </p>
  );
}

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
          src={meme.image_url}
          alt={meme.top_text || meme.bottom_text || "Meme"}
          draggable={false}
          loading="lazy"
          className="h-full w-full object-contain select-none"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-4">
          <MemeCaption text={meme.top_text} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-4">
          <MemeCaption text={meme.bottom_text} />
        </div>
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
