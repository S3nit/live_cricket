export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-zinc-900">Loading tournament data...</p>
        <p className="mt-2 text-sm text-zinc-500">The dashboard is preparing the live match view.</p>
      </div>
    </main>
  );
}
