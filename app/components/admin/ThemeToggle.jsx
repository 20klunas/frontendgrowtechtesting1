'use client'

import { Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ⛔ penting: jangan render sebelum mounted
  if (!mounted) return null

  const isDark = theme === "dark"

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <button
      onClick={toggleTheme}
      className="
        flex items-center gap-2
        px-3 py-2 rounded-lg
        bg-zinc-200 dark:bg-zinc-700
        text-zinc-900 dark:text-white
        hover:opacity-90
        transition
      "
    >
      {isDark ? (
        <>
          <Moon className="h-4 w-4" />
          Dark
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" />
          Light
        </>
      )}
    </button>
  )
}