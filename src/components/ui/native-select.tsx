import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** A browser picker with native form submission, option groups and change events. */
export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "min-h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-base text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}
