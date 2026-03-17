export default function Loading() {
  return (
    <section className="max-w-7xl mx-auto px-8 py-10 text-white animate-pulse">
      <div className="h-8 w-56 rounded bg-zinc-800 mb-10" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="space-y-6">
          <div className="border border-purple-700 rounded-2xl p-6 bg-black">
            <div className="h-5 w-40 rounded bg-zinc-800 mb-4" />
            <div className="h-4 w-24 rounded bg-zinc-800 mb-3" />
            <div className="h-8 w-40 rounded bg-zinc-800 mb-3" />
            <div className="h-4 w-56 rounded bg-zinc-800" />
          </div>

          <div className="border border-purple-700 rounded-2xl p-6 bg-black">
            <div className="h-5 w-40 rounded bg-zinc-800 mb-6" />
            <div className="grid grid-cols-3 gap-4 mb-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-zinc-800" />
              ))}
            </div>
            <div className="h-4 w-40 rounded bg-zinc-800 mb-3" />
            <div className="h-12 rounded-xl bg-zinc-800" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-purple-700 rounded-2xl p-6 bg-black">
            <div className="h-5 w-40 rounded bg-zinc-800 mb-6" />
            <div className="space-y-3">
              <div className="h-4 rounded bg-zinc-800" />
              <div className="h-4 rounded bg-zinc-800" />
              <div className="h-4 rounded bg-zinc-800" />
            </div>
            <div className="h-12 rounded-xl bg-zinc-800 mt-6" />
          </div>

          <div className="border border-purple-700 rounded-2xl p-6 bg-black">
            <div className="h-5 w-40 rounded bg-zinc-800 mb-6" />
            <div className="space-y-4">
              <div className="h-16 rounded-xl bg-zinc-800" />
              <div className="h-16 rounded-xl bg-zinc-800" />
              <div className="h-16 rounded-xl bg-zinc-800" />
            </div>
          </div>
        </div>
      </div>

      <div className="border border-purple-700 rounded-2xl p-6 bg-black">
        <div className="h-5 w-40 rounded bg-zinc-800 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-zinc-800" />
          ))}
        </div>
      </div>
    </section>
  );
}