import { BracketNode } from "@/types/cricket";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BracketTreeProps {
  nodes: BracketNode[];
}

export function BracketTree({ nodes }: BracketTreeProps) {
  const grouped = nodes.reduce<Record<string, BracketNode[]>>((acc, node) => {
    acc[node.round] = acc[node.round] ?? [];
    acc[node.round].push(node);
    return acc;
  }, {});

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-4 pb-2">
        {Object.entries(grouped).map(([round, matches]) => (
          <div key={round} className="w-72 space-y-3">
            <h3 className="text-sm font-semibold uppercase text-zinc-500">{round}</h3>
            {matches
              .sort((a, b) => a.bracketPosition - b.bracketPosition)
              .map((match) => (
                <Card key={match.id} className="space-y-1 p-3">
                  <div className="font-medium">{match.teamAName}</div>
                  <div className="font-medium">{match.teamBName}</div>
                  <Badge>{match.winnerName ?? match.status}</Badge>
                </Card>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
