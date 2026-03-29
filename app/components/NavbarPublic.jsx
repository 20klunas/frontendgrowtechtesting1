'use client'

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useWebsiteSettings } from '../context/WebsiteSettingsContext'

export default function NavbarPublic() {
  const pathname = usePathname()

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Product", href: "/product" },
  ]

  const isActive = (href) =>
    pathname === href || pathname.startsWith(href + "/")

  return (
    <nav className="sticky top-0 z-50 bg-[#14002a] border-b border-purple-800/40">
      <div className="mx-auto max-w-7xl px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Image src="/logoherosection.png" alt="logo" width={36} height={36} />
          <span className="text-white font-semibold">Growtech</span>
        </div>

        <div className="flex gap-6 items-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive(item.href)
                  ? "text-white"
                  : "text-white/70 hover:text-white"
              }
            >
                              {item.label}
                {isActive(item.href) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-2 left-0 right-0 h-[2px] bg-purple-500 rounded-full"
                  />
                )}
            </Link>
          ))}

          <Link
            href="/login"
            className="text-purple-300 hover:text-purple-200"
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  )
}