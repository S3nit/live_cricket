import { Activity } from "lucide-react";
import { Match, Innings, Team } from "@/types/cricket";
import { legalBallsToOvers, runRate } from "@/lib/scoring";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ScoreHeaderProps {
  match: Match;
  innings: Innings | null;
  teamA?: Team;
  teamB?: Team;
}

export function ScoreHeader({ match, innings, teamA, teamB }: ScoreHeaderProps) {
  return (
    <Card className="sticky top-0 z-20 border-emerald-100 bg-emerald-50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-zinc-500">{match.round}</p>
          <h2 className="text-xl font-bold">
            {teamA?.shortName ?? "Team A"} vs {teamB?.shortName ?? "Team B"}
          </h2>
          <p className="text-sm text-zinc-600">{match.venue}</p>
        </div>
        <div className="text-right">
          <Badge className="mb-1 bg-red-100 text-red-700">
            <Activity className="mr-1 h-3 w-3" /> {match.status.toUpperCase()}
          </Badge>
          <p className="text-2xl font-black">
            {innings ? `${innings.totalRuns}/${innings.totalWickets}` : "-/-"}
          </p>
          <p className="text-sm text-zinc-600">
            Ov {innings ? legalBallsToOvers(innings.legalBalls) : "0.0"} · RR {innings ? runRate(innings.totalRuns, innings.legalBalls) : 0}
          </p>
        </div>
      </div>
    </Card>
  );
}
