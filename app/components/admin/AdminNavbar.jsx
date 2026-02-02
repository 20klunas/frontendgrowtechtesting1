'use client'

import { Menu, Search, ShoppingCart, Settings, User, LogOut } from "lucide-react"
import { Button } from "../../components/ui/button"
import { useAuth } from "../../../app/hooks/useAuth"
import { useState, useRef, useEffect } from "react"
import ThemeToggle from "./ThemeToggle"

export default function AdminNavbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  // close dropdown jika klik luar
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#1a0a2e] border-b flex items-center justify-between px-4 lg:px-6">
      {/* LEFT */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="text-white hover:bg-white/10"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* RIGHT */}
      <div className="flex items-center gap-2 lg:gap-4 relative">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <Search className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <ShoppingCart className="h-5 w-5" />
        </Button>

        <ThemeToggle />

        {/* USER + DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 pl-2 hover:opacity-90"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-white">
                {user?.full_name || user?.name || "-"}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {user?.role || "-"}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-600">
              <User className="h-5 w-5 text-white" />
            </div>
          </button>

          {/* DROPDOWN */}
          {open && (
            <div className="absolute right-0 mt-2 w-44 rounded-lg border border-white/10 bg-[#12051f] shadow-lg">
              <button
                onClick={logout}
                className="
                  flex w-full items-center gap-3
                  px-4 py-3 text-sm
                  text-red-400
                  hover:bg-red-500/10
                "
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
