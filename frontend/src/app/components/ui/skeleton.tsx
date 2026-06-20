import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden bg-secondary/60 rounded-md",
        "before:absolute before:inset-0",
        "before:-translate-x-full",
        "before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r",
        "before:from-transparent before:via-white/60 before:to-transparent",
        className
      )}
      style={{
        animationTimingFunction: 'cubic-bezier(0.4, 0, 0.6, 1)',
      }}
      {...props}
    />
  );
}

export { Skeleton };
