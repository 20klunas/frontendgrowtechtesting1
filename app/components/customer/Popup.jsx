'use client'

import Image from "next/image"
import { memo } from "react"

function Popup({
  title,
  content,
  image,
  ctaText,
  ctaUrl,
  onClose,
}) {

  if (!title && !content && !image) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">

      <div className="w-full max-w-[520px] mx-4 rounded-2xl overflow-hidden shadow-2xl bg-white">

        {title && (
          <div className="flex items-center justify-between bg-purple-800 px-6 py-4 text-white">
            <div className="font-semibold text-lg uppercase">
              📢 {title}
            </div>

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>
        )}

        <div className="px-8 py-10 text-center space-y-6 text-black">

          {image && (
            <Image
              src={image}
              alt="Popup"
              width={400}
              height={240}
              sizes="(max-width:768px) 80vw, 400px"
              className="mx-auto object-contain rounded-lg"
            />
          )}

          {content && (
            <p className="text-gray-700 whitespace-pre-line leading-relaxed text-lg">
              {content}
            </p>
          )}

          {ctaText && (
            <a
              href={ctaUrl || "#"}
              target={ctaUrl ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="inline-flex justify-center bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg text-white font-semibold text-lg"
            >
              {ctaText}
            </a>
          )}

        </div>

      </div>

    </div>
  )
}

export default memo(Popup)