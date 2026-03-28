"use client";

import AppTransitionLink from "./AppTransitionLink";
import { useWebsiteSettings } from "../context/WebsiteSettingsContext";

export default function Footer() {
  const { brand, footer } = useWebsiteSettings();
  const siteName = brand?.site_name || "Growtech Central";

  return (
    <footer
      className="
      border-t border-purple-800/40
      bg-gradient-to-b from-black to-[#0a0014]
      text-white
      overflow-hidden
    "
    >
      <div
        className="
        max-w-7xl mx-auto
        px-4 sm:px-6 lg:px-8
        py-12
        grid grid-cols-1 md:grid-cols-4
        gap-10
      "
      >
        <div className="space-y-3 text-center md:text-left">
          <h3 className="text-lg font-semibold">{siteName}</h3>

          {footer?.footer_desc && (
            <p className="text-sm text-gray-400 leading-relaxed">
              {footer.footer_desc}
            </p>
          )}

          {brand?.version && (
            <p className="text-xs text-gray-500">Version {brand.version}</p>
          )}
        </div>

        <div className="space-y-3 text-center md:text-left">
          <h4 className="font-semibold text-purple-400">Informasi</h4>

          <FooterLink href="/customer/faq" message="Menyiapkan halaman FAQ...">
            FAQ
          </FooterLink>
          <FooterLink href="/customer/contact" message="Menyiapkan halaman kontak...">
            Contact Us
          </FooterLink>
          <FooterLink href="/customer/terms" message="Menyiapkan ketentuan layanan...">
            Ketentuan Layanan
          </FooterLink>
          <FooterLink href="/customer/privacy" message="Menyiapkan kebijakan privasi...">
            Kebijakan Privasi
          </FooterLink>
        </div>

        <div className="space-y-3 text-center md:text-left">
          <h4 className="font-semibold text-purple-400">Akun</h4>

          <FooterLink href="/login" message="Menyiapkan halaman login...">
            Login
          </FooterLink>
          <FooterLink href="/register" message="Menyiapkan halaman register...">
            Register
          </FooterLink>
          <FooterLink href="/customer" message="Menyiapkan dashboard Anda...">
            Dashboard
          </FooterLink>
        </div>

        <div className="space-y-3 text-center md:text-left flex flex-col items-center md:items-start">
          <h4 className="font-semibold text-purple-400">Kontak</h4>

          {brand?.phone && (
            <a href={brand.phone} target="_blank" className="footer-link block">
              {brand.phone}
            </a>
          )}

          {brand?.email && (
            <a href={`mailto:${brand.email}`} className="footer-link block">
              {brand.email}
            </a>
          )}
        </div>
      </div>

      <div className="border-t border-purple-900/20" />

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
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </span>

        <div className="flex items-center gap-4">
          <FooterLink href="/customer/terms" message="Menyiapkan ketentuan layanan...">
            Terms
          </FooterLink>
          <FooterLink href="/customer/privacy" message="Menyiapkan kebijakan privasi...">
            Privacy
          </FooterLink>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children, message }) {
  return (
    <AppTransitionLink href={href} transitionMessage={message} className="footer-link block">
      {children}
    </AppTransitionLink>
  );
}