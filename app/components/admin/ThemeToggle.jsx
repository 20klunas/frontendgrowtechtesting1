'use client'
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("admin-theme")
    if (saved === "light") {
      document.documentElement.classList.remove("dark")
      setDark(false)
    }
  }, [])

  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("admin-theme", "light")
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("admin-theme", "dark")
    }
    setDark(!dark)
  }

  return (
    <button
      onClick={toggleTheme}
      className="px-3 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-sm"
    >
      {dark ? "🌙 Dark" : "☀️ Light"}
    </button>
  )
}
