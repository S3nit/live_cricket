"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-red-800">Something went wrong</p>
        <p className="mt-2 text-sm text-red-700">The match view could not be loaded. Please try again.</p>
        <button
          onClick={() => reset()}
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
