import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass-subtle animate-pulse rounded-xl", className)} {...props} />;
}

export { Skeleton };
