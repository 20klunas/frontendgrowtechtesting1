export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="h-[180px] bg-zinc-800"></div>
      <div className="p-4 space-y-2">
        <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
        <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
        <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
      </div>
    </div>
  );
}