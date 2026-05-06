'use client'

const TYPE_STYLE = {
  success: 'border-emerald-400/70 bg-emerald-500/15 text-emerald-50',
  error: 'border-red-400/70 bg-red-500/15 text-red-50',
  warning: 'border-yellow-400/70 bg-yellow-500/15 text-yellow-50',
  info: 'border-sky-400/70 bg-sky-500/15 text-sky-50',
}

export default function Toast({ message, type = 'success', onClose }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[9999] max-w-sm rounded-2xl border px-5 py-3 shadow-2xl backdrop-blur-xl ${TYPE_STYLE[type] || TYPE_STYLE.success}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 text-sm font-semibold leading-5">{message}</div>
        {onClose ? (
          <button type="button" onClick={onClose} className="text-lg leading-none opacity-70 hover:opacity-100" aria-label="Tutup notifikasi">
            ×
          </button>
        ) : null}
      </div>
    </div>
  )
}
