import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2",
        className,
      )}
      {...props}
    />
  );
}
