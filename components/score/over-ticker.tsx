import { Ball } from "@/types/cricket";
import { ballDisplay } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface OverTickerProps {
  balls: Ball[];
}

export function OverTicker({ balls }: OverTickerProps) {
  const lastSix = balls.slice(-6);

  return (
    <div>
      <h3 className="mb-2 text-lg font-semibold">Current Over</h3>
      <div className="flex gap-2">
        {lastSix.map((ball) => {
          const tone = ball.isWicket
            ? "bg-red-100 text-red-700"
            : ball.runs === 4
              ? "bg-emerald-100 text-emerald-700"
              : ball.runs === 6
                ? "bg-purple-100 text-purple-700"
                : ball.isWide || ball.isNoBall
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-zinc-100 text-zinc-700";
          return (
            <span key={ball.id} className={cn("rounded-full px-3 py-1 text-sm font-bold", tone)}>
              {ballDisplay(ball)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
