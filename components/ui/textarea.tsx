import { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-20 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2",
        className,
      )}
      {...props}
    />
  );
}
