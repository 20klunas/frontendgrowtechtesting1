export default function CustomerLoading() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="w-full py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="h-6 w-40 animate-pulse rounded bg-purple-900/40" />
            <div className="mt-6 h-16 w-[85%] animate-pulse rounded bg-white/10" />
            <div className="mt-4 h-16 w-[72%] animate-pulse rounded bg-white/10" />
            <div className="mt-8 h-5 w-[80%] animate-pulse rounded bg-white/10" />
            <div className="mt-3 h-5 w-[65%] animate-pulse rounded bg-white/10" />

            <div className="mt-10 flex gap-4">
              <div className="h-12 w-44 animate-pulse rounded-xl bg-purple-700/40" />
              <div className="h-12 w-36 animate-pulse rounded-xl bg-white/10" />
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="h-[320px] w-[320px] animate-pulse rounded-full bg-purple-900/20 shadow-[0_0_80px_rgba(168,85,247,0.18)]" />
          </div>
        </div>
      </section>

      <section className="w-full pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl border border-purple-800/30 bg-purple-900/10"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="h-56 animate-pulse rounded-3xl border border-purple-800/30 bg-purple-900/10" />
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-8 h-8 w-56 animate-pulse rounded bg-white/10" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-2xl border border-purple-800/30 bg-purple-900/10"
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}