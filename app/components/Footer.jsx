'use client'

import { useEffect, useState } from "react"
import Link from "next/link"

const normalizeSettings = (rows = []) =>
  rows.reduce((acc, row) => {
    acc[row.key] = row.value
    return acc
  }, {})

export default function Footer() {
  const API = process.env.NEXT_PUBLIC_API_URL

  const [brand, setBrand] = useState({})
  const [footer, setFooter] = useState({})

  useEffect(() => {
    fetch(`${API}/api/v1/content/settings?group=website`)
      .then(res => res.json())
      .then(res => {
        const data = normalizeSettings(res?.data)
        setBrand(data.brand || {})
        setFooter(data.footer || {})
      })
      .catch(console.error)
  }, [API])

  return (
    <footer className="
      border-t border-purple-800/40
      bg-black
      text-white
      mt-16
      overflow-hidden
    ">
      <div className="
        footer-inner
        max-w-7xl mx-auto
        px-4 sm:px-6 lg:px-8
        py-10
        grid grid-cols-1 md:grid-cols-3
        gap-8
      ">

        {/* ================= LEFT ================= */}
        <div className="footer-left text-center md:text-left">
          <h3 className="text-lg font-semibold">
            {brand.site_name || "Growtech Central"}
          </h3>

          {footer.footer_desc && (
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
              {footer.footer_desc}
            </p>
          )}

          {brand.version && (
            <p className="text-xs text-gray-500 mt-2">
              {brand.version}
            </p>
          )}
        </div>

        {/* ================= LINKS ================= */}
        <div className="
          footer-links
          col-span-1 md:col-span-2
          grid grid-cols-1 sm:grid-cols-2
          gap-6
          text-center sm:text-left
          w-full
        ">

          {/* INFO */}
          <div className="flex flex-col gap-2">
            <h4 className="font-semibold text-purple-400">
              Informasi Kami
            </h4>

            <Link href="/faq" className="footer-link">FAQ</Link>
            <Link href="/contact" className="footer-link">Contact Us</Link>
            <Link href="/terms" className="footer-link">Ketentuan Layanan</Link>
            <Link href="/privacy" className="footer-link">Kebijakan Privasi</Link>
          </div>

          {/* KONTAK */}
          <div className="flex flex-col gap-2">
            <h4 className="font-semibold text-purple-400">
              Kontak
            </h4>

            {brand.phone && (
              <a
                href={brand.phone}
                target="_blank"
                className="footer-link"
              >
                {brand.phone}
              </a>
            )}

            {brand.email && (
              <a
                href={`mailto:${brand.email}`}
                className="footer-link"
              >
                {brand.email}
              </a>
            )}
          </div>

        </div>

      </div>
    </footer>
  )
}