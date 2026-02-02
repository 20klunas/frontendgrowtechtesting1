'use client'

import { useState } from "react"
import AdminNavbar from "../components/admin/AdminNavbar"
import AdminSidebar from "../components/admin/AdminSidebar"
import AdminFooter from "../components/admin/AdminFooter"

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="bg-white dark:bg-zinc-950 min-h-screen">

      {/* NAVBAR */}
      <AdminNavbar
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* SIDEBAR */}
      <AdminSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        collapsed={collapsed}
      />

      {/* MAIN CONTENT */}
      <main
        className={`
          pt-14 transition-all duration-300
          ${sidebarOpen
            ? collapsed
              ? "lg:pl-20"
              : "lg:pl-64"
            : "lg:pl-0"}
        `}
      >
        <div className="p-4 lg:p-6 min-h-[calc(100vh-56px)] text-zinc-900 dark:text-zinc-100">
          {children}
        </div>

        <AdminFooter />
      </main>

    </div>
  )
}
