"use client"

import { useState, useEffect } from "react"
import AdminNavbar from "../components/admin/AdminNavbar"
import AdminSidebar from "../components/admin/AdminSidebar"
import AdminFooter from "../components/admin/AdminFooter"
import { Toaster } from "react-hot-toast"
import { ThemeProvider } from "next-themes"
export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [theme, setTheme] = useState("dark")

  useEffect(() => {
    const saved = localStorage.getItem("admin-theme")
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    const html = document.documentElement
    html.classList.remove("light", "dark")
    html.classList.add(theme)
    localStorage.setItem("admin-theme", theme)
  }, [theme])

  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <div
        className="admin min-h-screen flex flex-col transition-colors"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        {/* NAVBAR */}
        <AdminNavbar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          theme={theme}
          setTheme={setTheme}
        />

        {/* BODY (SIDEBAR + CONTENT) */}
        <div className="flex flex-1">
          <AdminSidebar
            open={sidebarOpen}
            setOpen={setSidebarOpen}
            collapsed={collapsed}
          />

          {/* MAIN CONTENT */}
          <main
            className={`
              flex flex-col flex-1
              pt-14 transition-all duration-300
              ${sidebarOpen
                ? collapsed
                  ? "lg:pl-20"
                  : "lg:pl-64"
                : "lg:pl-0"}
            `}
          >
            {/* PAGE CONTENT */}
            <div className="flex-1 p-4 lg:p-6 text-zinc-900 dark:text-zinc-100">
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: "#1e1b4b",
                    color: "#fff",
                    border: "1px solid #7c3aed"
                  }
                }}
              />
            </div>

            {/* FOOTER */}
            <AdminFooter />
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
