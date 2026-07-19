"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { getPlayersByIds, subscribeInnings, subscribeLastBalls, subscribeMatch, subscribePlayers, subscribeTeams } from "@/lib/firestore";
import { Ball, BracketNode, Innings, Match, Player, Team } from "@/types/cricket";
import { ScoreHeader } from "@/components/score/score-header";
import { BattingCard } from "@/components/score/batting-card";
import { BowlingCard } from "@/components/score/bowling-card";
import { OverTicker } from "@/components/score/over-ticker";
import { Card } from "@/components/ui/card";
import { CommentFeed } from "@/components/score/comment-feed";
import { BracketTree } from "@/components/score/bracket-tree";
import { requiredRunRate, runRate } from "@/lib/scoring";

export function LiveMatchView() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId") ?? "";
  const tournamentId = searchParams.get("tournamentId") ?? process.env.NEXT_PUBLIC_DEFAULT_TOURNAMENT_ID ?? "";
  const { user, admin } = useAuth();

  const [match, setMatch] = useState<Match | null>(null);
  const [innings, setInnings] = useState<Innings | null>(null);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [playingXIPlayers, setPlayingXIPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const unsubTeams = subscribeTeams(tournamentId, setTeams);
    const unsubPlayers = subscribePlayers(tournamentId, setPlayers);
    return () => {
      unsubTeams();
      unsubPlayers();
    };
  }, [tournamentId]);

  useEffect(() => {
    if (!matchId) return;

    const unsubMatch = subscribeMatch(tournamentId, matchId, setMatch);
    return () => unsubMatch();
  }, [matchId, tournamentId]);

  useEffect(() => {
    if (!matchId || !match) return;

    const inningsNo = match.currentInnings;
    const unsubInnings = subscribeInnings(tournamentId, matchId, inningsNo, setInnings);
    const unsubBalls = subscribeLastBalls(tournamentId, matchId, inningsNo, 36, setBalls);

    return () => {
      unsubInnings();
      unsubBalls();
    };
  }, [match, matchId, tournamentId]);

  useEffect(() => {
    if (!match) return;
    const ids = Array.from(new Set(Object.values(match.playingXI).flat()));
    getPlayersByIds(tournamentId, ids)
      .then(setPlayingXIPlayers)
      .catch(() => setPlayingXIPlayers([]));
  }, [match, tournamentId]);

  const teamMap = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const innings1Balls = useMemo(() => balls.filter((ball) => ball.inningsNumber === 1), [balls]);
  const cumulative = innings1Balls.map((ball, index) => ({
    over: `${ball.overNumber}.${ball.ballInOver}`,
    runs:
      innings1Balls.slice(0, index + 1).reduce((sum, item) => sum + item.runs + (item.isWide || item.isNoBall ? 1 : 0), 0),
  }));

  const bracketNodes: BracketNode[] = match
    ? [
        {
          id: match.id,
          round: match.round,
          bracketPosition: match.bracketPosition,
          teamAName: teamMap.get(match.teamAId)?.shortName ?? "TBA",
          teamBName: teamMap.get(match.teamBId)?.shortName ?? "TBA",
          winnerName: match.winnerTeamId ? teamMap.get(match.winnerTeamId)?.shortName : undefined,
          status: match.status,
        },
      ]
    : [];

  if (!tournamentId || !matchId) return <Card>Select a match from dashboard.</Card>;
  if (!match) return <Card>Loading match...</Card>;

  const teamA = teamMap.get(match.teamAId);
  const teamB = teamMap.get(match.teamBId);
  const target = 160;
  const rrr = innings ? requiredRunRate(target, innings.totalRuns, Math.max(0, 120 - innings.legalBalls)) : 0;

  return (
    <div className="space-y-4">
      <ScoreHeader match={match} innings={innings} teamA={teamA} teamB={teamB} />

      <Card>
        <h3 className="mb-2 text-lg font-semibold">Live insights</h3>
        <p className="text-sm text-zinc-600">RR: {innings ? runRate(innings.totalRuns, innings.legalBalls) : 0} · RRR: {rrr}</p>
        <div className="mt-2 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cumulative}>
              <XAxis dataKey="over" hide />
              <YAxis />
              <Tooltip />
              <Line dataKey="runs" stroke="#059669" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <OverTicker balls={balls} />

      <div className="grid gap-4 md:grid-cols-2">
        <BattingCard innings={innings} players={players} />
        <BowlingCard innings={innings} players={players} />
      </div>

      <Card>
        <h3 className="mb-2 text-lg font-semibold">Playing XI</h3>
        <ul className="grid gap-1 text-sm md:grid-cols-2">
          {playingXIPlayers.map((player) => (
            <li key={player.id}>
              {player.name} · {player.role}
            </li>
          ))}
        </ul>
      </Card>

      <BracketTree nodes={bracketNodes} />

      <CommentFeed
        tournamentId={tournamentId}
        matchId={matchId}
        currentUid={user?.uid}
        currentName={user?.displayName ?? undefined}
        canModerate={admin}
      />
    </div>
  );
}
