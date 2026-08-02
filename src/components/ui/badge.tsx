import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
  variants: {
    variant: {
      default: "border-white/25 bg-primary/70 backdrop-blur-md text-primary-foreground hover:bg-primary/85",
      secondary: "border-white/20 bg-secondary/60 backdrop-blur-md text-secondary-foreground hover:bg-secondary/80",
      destructive: "border-white/25 bg-destructive/70 backdrop-blur-md text-destructive-foreground hover:bg-destructive/85",
      outline: "glass-subtle text-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
