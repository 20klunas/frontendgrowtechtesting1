'use client'

import { useState } from 'react'

export default function FAQList({ faqs = [] }) {
  const [open, setOpen] = useState(-1)

  if (!faqs.length) {
    return (
      <div className="text-center text-gray-400">
        Belum ada FAQ tersedia.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {faqs.map((f, i) => (
        <div
          key={f.id}
          className="border border-purple-700 rounded-2xl overflow-hidden"
        >
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <div className="flex items-center gap-3">
              {f.tag && (
                <span className="text-xs px-3 py-1 rounded-full bg-white text-black">
                  {f.tag}
                </span>
              )}

              <span className="text-xl font-semibold">
                {f.question}
              </span>
            </div>

            <span className="text-xl transition-transform">
              {open === i ? '˄' : '˅'}
            </span>
          </button>

          <div
            className={`transition-all duration-300 overflow-hidden ${
              open === i ? 'max-h-96 p-6' : 'max-h-0'
            } bg-gradient-to-b from-purple-900/60 to-black text-gray-200`}
          >
            {f.answer}
          </div>
        </div>
      ))}
    </div>
  )
}