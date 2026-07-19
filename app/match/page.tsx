import { Suspense } from "react";
import { LiveMatchView } from "@/components/score/live-match-view";

export default function MatchPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="rounded-lg border border-zinc-200 bg-white p-6">Loading match...</div>}>
        <LiveMatchView />
      </Suspense>
    </main>
  );
}
