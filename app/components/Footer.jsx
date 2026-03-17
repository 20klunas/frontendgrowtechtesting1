'use client'

import Link from "next/link"

export default function Footer({ brand = {}, footer = {} }) {

  return (

    <footer
      className="
      border-t border-purple-800/40
      bg-gradient-to-b from-black to-[#0a0014]
      text-white
      overflow-hidden
    "
    >

      {/* ================= TOP ================= */}

      <div
        className="
        max-w-7xl mx-auto
        px-4 sm:px-6 lg:px-8
        py-12
        grid grid-cols-1 md:grid-cols-4
        gap-10
      "
      >

        {/* BRAND */}

        <div className="space-y-3 text-center md:text-left">

          <h3 className="text-lg font-semibold">
            {brand.site_name || "Growtech Central"}
          </h3>

          {footer.footer_desc && (
            <p className="text-sm text-gray-400 leading-relaxed">
              {footer.footer_desc}
            </p>
          )}

          {brand.version && (
            <p className="text-xs text-gray-500">
              Version {brand.version}
            </p>
          )}

        </div>


        {/* INFORMASI */}

        <div className="space-y-3 text-center md:text-left">

          <h4 className="font-semibold text-purple-400">
            Informasi
          </h4>

          <FooterLink href="/faq">FAQ</FooterLink>
          <FooterLink href="/contact">Contact Us</FooterLink>
          <FooterLink href="/terms">Ketentuan Layanan</FooterLink>
          <FooterLink href="/privacy">Kebijakan Privasi</FooterLink>

        </div>


        {/* AKUN */}

        <div className="space-y-3 text-center md:text-left">

          <h4 className="font-semibold text-purple-400">
            Akun
          </h4>

          <FooterLink href="/login">Login</FooterLink>
          <FooterLink href="/register">Register</FooterLink>
          <FooterLink href="/customer">Dashboard</FooterLink>

        </div>


        {/* KONTAK */}

        <div className="space-y-3 text-center md:text-left flex flex-col items-center md:items-start">

          <h4 className="font-semibold text-purple-400">
            Kontak
          </h4>

          {brand.phone && (
            <a
              href={brand.phone}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link block"
            >
              {brand.phone}
            </a>
          )}

          {brand.email && (
            <a
              href={`mailto:${brand.email}`}
              className="footer-link block"
            >
              {brand.email}
            </a>
          )}

        </div>

      </div>


      {/* ================= DIVIDER ================= */}

      <div className="border-t border-purple-900/20" />


      {/* ================= BOTTOM ================= */}

      <div
        className="
        max-w-7xl mx-auto
        px-4 sm:px-6 lg:px-8
        py-4
        flex flex-col sm:flex-row
        items-center
        justify-between
        gap-3
        text-xs text-gray-500
      "
      >

        <span>
          © {new Date().getFullYear()} {brand.site_name || "Growtech Central"}.
          All rights reserved.
        </span>

        <div className="flex items-center gap-4">

          <FooterLink href="/terms">Terms</FooterLink>
          <FooterLink href="/privacy">Privacy</FooterLink>

        </div>

      </div>

    </footer>

  )

}


/* ================= FOOTER LINK COMPONENT ================= */

function FooterLink({ href, children }) {

  return (

    <Link
      href={href}
      className=" footer-link block text-sm text-gray-400 hover:text-white transition"
    >
      {children}
    </Link>

  )

}