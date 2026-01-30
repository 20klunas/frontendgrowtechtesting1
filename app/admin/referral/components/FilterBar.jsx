import { Funnel } from 'lucide-react'

export default function FilterBar() {
  return (
    <div className="flex items-center gap-4 mb-6">
      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white">
        <Funnel size={16} /> Filter
      </button>
      <input
        type="text"
        className="flex-1 bg-purple-900/40 border border-purple-700 rounded-lg px-4 py-2 text-white outline-none"
      />
    </div>
  )
}
