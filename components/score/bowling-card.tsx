import { Innings, Player } from "@/types/cricket";
import { Card } from "@/components/ui/card";
import { legalBallsToOvers } from "@/lib/scoring";

interface BowlingCardProps {
  innings: Innings | null;
  players: Player[];
}

export function BowlingCard({ innings, players }: BowlingCardProps) {
  if (!innings) return <Card>Waiting for innings data...</Card>;

  const rows = Object.values(innings.bowlingStats).sort((a, b) => b.wickets - a.wickets);
  const playerMap = new Map(players.map((p) => [p.id, p]));

  return (
    <Card>
      <h3 className="mb-2 text-lg font-semibold">Bowling</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-zinc-500">
            <tr>
              <th className="py-1">Bowler</th><th>Ov</th><th>R</th><th>W</th><th>Eco</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.playerId} className="border-t border-zinc-100">
                <td className="py-1">{playerMap.get(row.playerId)?.name ?? row.playerId}</td>
                <td>{legalBallsToOvers(row.balls)}</td>
                <td>{row.runs}</td>
                <td>{row.wickets}</td>
                <td>{row.balls ? ((row.runs * 6) / row.balls).toFixed(2) : "0.00"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
