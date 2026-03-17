export default function Loading() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-8 pt-10 animate-pulse">
        <div className="h-10 w-48 rounded bg-zinc-800 mb-10" />
      </div>

      <section className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-3 gap-10 animate-pulse">
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-purple-700 p-6 bg-black"
            >
              <div className="flex gap-4 items-center">
                <div className="h-20 w-20 rounded-xl bg-zinc-800" />
                <div className="flex-1">
                  <div className="h-5 w-48 rounded bg-zinc-800 mb-3" />
                  <div className="h-4 w-28 rounded bg-zinc-800 mb-4" />
                  <div className="h-8 w-36 rounded bg-zinc-800" />
                </div>
                <div className="h-6 w-24 rounded bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-purple-700 p-6 bg-black">
            <div className="h-4 w-40 rounded bg-zinc-800 mb-4" />
            <div className="h-11 rounded-xl bg-zinc-800" />
          </div>

          <div className="rounded-2xl border border-purple-700 p-6 bg-black">
            <div className="h-6 w-32 rounded bg-zinc-800 mb-6" />
            <div className="space-y-3">
              <div className="h-4 rounded bg-zinc-800" />
              <div className="h-4 rounded bg-zinc-800" />
              <div className="h-4 rounded bg-zinc-800" />
            </div>
            <div className="h-12 rounded-xl bg-zinc-800 mt-6" />
          </div>
        </div>
      </section>
    </main>
  );
}