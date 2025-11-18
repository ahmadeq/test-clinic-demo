"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<"input">
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    className={cn(
      "peer size-4 rounded border border-input bg-background text-primary accent-[color:var(--primary)] transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60",
      className
    )}
    {...props}
  />
));

Checkbox.displayName = "Checkbox";

export { Checkbox };
