import { ViewerDashboard } from "@/components/score/viewer-dashboard";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-900 via-emerald-800 to-zinc-900 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Live tournament hub</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Real-time cricket scorecards and bracket updates</h1>
            <p className="mt-3 max-w-2xl text-sm text-emerald-50/90 sm:text-base">
              Follow the action, monitor the current over, and jump into any match from a single polished dashboard.
            </p>
          </div>
          <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium">
            Ready for live scoring
          </div>
        </div>
      </section>

      <ViewerDashboard defaultTournamentId={process.env.NEXT_PUBLIC_DEFAULT_TOURNAMENT_ID} />
    </main>
  );
}
