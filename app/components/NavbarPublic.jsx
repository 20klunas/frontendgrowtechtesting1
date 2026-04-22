'use client'

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { useWebsiteSettings } from "../context/WebsiteSettingsContext"
import { allowAuthNavigationOnce } from "../lib/maintenanceHandler"

export default function NavbarPublic() {
  const pathname = usePathname()
  const { brand } = useWebsiteSettings()

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Product", href: "/product" },
  ]

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`)
  const siteName = brand?.site_name || "Growtech Central"

  const goToLogin = (event) => {
    event.preventDefault()
    allowAuthNavigationOnce()
    window.location.href = "/login"
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-purple-800/40 bg-[#14002a]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <Image src="/logoherosection.png" alt={siteName} width={36} height={36} />
          <span className="text-white font-semibold">{siteName}</span>
        </div>

        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive(item.href)
                  ? "relative text-white"
                  : "relative text-white/70 hover:text-white"
              }
            >
              {item.label}
              {isActive(item.href) && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute -bottom-2 left-0 right-0 h-[2px] rounded-full bg-purple-500"
                />
              )}
            </Link>
          ))}

          <a href="/login" onClick={goToLogin} className="text-purple-300 hover:text-purple-200">
            Login
          </a>
        </div>
      </div>
    </nav>
  )
}
