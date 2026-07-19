"use client";

import Link from "next/link";
import { CalendarClock, CircleDot } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { subscribeMatches, subscribeTeams, subscribeTournaments } from "@/lib/firestore";
import { Match, Team, Tournament } from "@/types/cricket";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ViewerDashboardProps {
  defaultTournamentId?: string;
}

export function ViewerDashboard({ defaultTournamentId }: ViewerDashboardProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState(defaultTournamentId ?? "");
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeTournaments((items) => {
      setTournaments(items);
      if (!selectedTournamentId && items.length) {
        setSelectedTournamentId(items[0].id);
      }
    });
    return () => unsubscribe();
  }, [selectedTournamentId]);

  useEffect(() => {
    if (!selectedTournamentId) return;

    const unsubMatches = subscribeMatches(selectedTournamentId, setMatches);
    const unsubTeams = subscribeTeams(selectedTournamentId, setTeams);

    return () => {
      unsubMatches();
      unsubTeams();
    };
  }, [selectedTournamentId]);

  const teamMap = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);

  const sections = {
    live: matches.filter((match) => match.status === "live"),
    upcoming: matches.filter((match) => match.status === "scheduled"),
    completed: matches.filter((match) => match.status === "completed"),
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl bg-zinc-900 p-6 text-white">
        <h1 className="text-3xl font-black">Live Cricket Tournament</h1>
        <p className="mt-2 text-zinc-300">Real-time scorecards, bracket updates, and fan comments.</p>
      </section>

      <section>
        <label htmlFor="tournament" className="mb-1 block text-sm font-medium">
          Tournament
        </label>
        <select
          id="tournament"
          className="h-10 w-full rounded-md border border-zinc-300 px-3"
          value={selectedTournamentId}
          onChange={(event) => setSelectedTournamentId(event.target.value)}
        >
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name}
            </option>
          ))}
        </select>
      </section>

      {([
        ["Live", sections.live],
        ["Upcoming", sections.upcoming],
        ["Completed", sections.completed],
      ] as const).map(([label, list]) => (
        <section key={label}>
          <h2 className="mb-2 text-xl font-semibold">{label}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {list.map((match) => (
              <Link key={match.id} href={`/match?matchId=${match.id}&tournamentId=${selectedTournamentId}`}>
                <Card className="hover:border-emerald-400">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{match.round}</p>
                    <Badge className={match.status === "live" ? "bg-red-100 text-red-700" : ""}>
                      {match.status === "live" ? <CircleDot className="mr-1 h-3 w-3" /> : null}
                      {match.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm">
                    {teamMap.get(match.teamAId)?.shortName ?? "TBA"} vs {teamMap.get(match.teamBId)?.shortName ?? "TBA"}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                    <CalendarClock className="h-3 w-3" /> {new Date(match.scheduledAt).toLocaleString()}
                  </p>
                </Card>
              </Link>
            ))}
            {!list.length && <Card>No {label.toLowerCase()} matches yet.</Card>}
          </div>
        </section>
      ))}
    </div>
  );
}
