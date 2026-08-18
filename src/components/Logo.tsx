import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

/** Square orange logo mark with a black pulse glyph. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-9 items-center justify-center border-2 border-foreground bg-primary text-primary-foreground shadow-brutal-sm",
        className,
      )}
      aria-hidden
    >
      <Activity className="size-5" strokeWidth={3} />
    </div>
  );
}

/** Logo mark + wordmark, for navbars and sidebars. */
export function Logo({
  className,
  dark = false,
}: {
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <div className="leading-none">
        <span className="text-lg font-black tracking-tight text-foreground">
          WorkPulse
        </span>
        <span className="ml-1.5 inline-block translate-y-[-1px] border-2 border-foreground bg-primary px-1 text-[10px] font-black uppercase tracking-wider text-primary-foreground">
          AI
        </span>
        {dark ? (
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Workforce OS
          </p>
        ) : null}
      </div>
    </div>
  );
}
