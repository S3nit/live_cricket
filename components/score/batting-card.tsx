import { Innings, Player } from "@/types/cricket";
import { Card } from "@/components/ui/card";

interface BattingCardProps {
  innings: Innings | null;
  players: Player[];
}

export function BattingCard({ innings, players }: BattingCardProps) {
  if (!innings) return <Card>Waiting for innings data...</Card>;

  const rows = Object.values(innings.battingStats).sort((a, b) => b.runs - a.runs);
  const playerMap = new Map(players.map((p) => [p.id, p]));

  return (
    <Card>
      <h3 className="mb-2 text-lg font-semibold">Batting</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-zinc-500">
            <tr>
              <th className="py-1">Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.playerId} className="border-t border-zinc-100">
                <td className="py-1">{playerMap.get(row.playerId)?.name ?? row.playerId}</td>
                <td>{row.runs}</td>
                <td>{row.balls}</td>
                <td>{row.fours}</td>
                <td>{row.sixes}</td>
                <td>{row.balls ? ((row.runs / row.balls) * 100).toFixed(1) : "0.0"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
