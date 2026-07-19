import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "destructive" | "secondary";
}

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "default" && "bg-emerald-600 text-white hover:bg-emerald-700",
        variant === "outline" && "border border-zinc-300 bg-white hover:bg-zinc-100",
        variant === "destructive" && "bg-red-600 text-white hover:bg-red-700",
        variant === "secondary" && "bg-zinc-800 text-white hover:bg-zinc-900",
        className,
      )}
      {...props}
    />
  );
}
