import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700", className)}
      {...props}
    />
  );
}
