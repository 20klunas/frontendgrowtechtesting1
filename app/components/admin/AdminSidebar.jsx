"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { useMemo, useState } from "react"
import { adminMenu } from "../../rbac/adminMenu"
import { usePermission } from "../../hooks/usePermission"

export default function AdminSidebar({ open, setOpen, collapsed }) {
  const pathname = usePathname()
  const { can, loading } = usePermission()

  const visibleGroups = useMemo(() => {
    if (loading) return []

    return adminMenu
      .map((group) => {
        const visibleItems = (group.items || []).filter(
          (item) => !item.permission || can(item.permission)
        )

        return {
          ...group,
          items: visibleItems,
        }
      })
      .filter((group) => group.items.length > 0)
  }, [can, loading])

  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      {/* <aside
        className={`
          fixed left-0 top-14 z-40
          h-[calc(100vh-56px)]
          ${collapsed ? "w-20" : "w-64"}

          bg-gradient-to-b 
          from-purple-100 
          to-white

          dark:from-[#2a0446] 
          dark:to-[#12001f]

          border-r border-purple-200 dark:border-purple-800/40
          transition-all duration-300

          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      > */}
      <aside
        className={`
          fixed left-0 top-14 z-40
          h-[calc(100vh-56px)]
          ${collapsed ? "w-20" : "w-64"}

          bg-[var(--card)]
          border-r border-[var(--card-border)]
          backdrop-blur-lg
          shadow-lg

          transition-all duration-300

          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-5 pb-24 space-y-6 text-sm">
          {visibleGroups.map((group) => (
            <SidebarGroup key={group.group} title={group.group}>
              {group.dropdown ? (
                <SidebarDropdown
                  label={group.group}
                  icon={group.icon}
                  pathname={pathname}
                  items={group.items}
                />
              ) : (
                group.items.map((menu) => (
                  <SidebarItem
                    key={menu.href}
                    label={menu.label}
                    href={menu.href}
                    icon={menu.icon}
                    pathname={pathname}
                    collapsed={collapsed}
                  />
                ))
              )}
            </SidebarGroup>
          ))}
        </nav>
      </aside>
    </>
  )
}

function SidebarGroup({ title, children }) {
  return (
    <div>
      <div className="px-3 mb-2 text-[10px] tracking-widest text-purple-700/70 dark:text-purple-300/60 font-semibold uppercase">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function SidebarItem({ label, href, icon: Icon, pathname, collapsed }) {
  const active = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={`
        relative group flex items-center gap-3
        px-4 py-2.5 rounded-lg
        transition-all duration-200
        ${
          active
            ? "bg-purple-600 text-white shadow-sm shadow-purple-900/30"
            : "text-gray-600 dark:text-gray-300 hover:bg-purple-200/40 dark:hover:bg-purple-800/40"
        }
      `}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-purple-400" />
      )}

      {Icon ? <Icon size={18} /> : <span className="w-[18px]" />}

      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}

function SidebarDropdown({ label, icon: Icon, pathname, items }) {
  const isAnyActive = items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )

  const [open, setOpen] = useState(isAnyActive)

  return (
    <div className="rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`
          w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition
          ${
            isAnyActive
              ? "bg-purple-700/40 text-white"
              : "text-gray-300 hover:bg-purple-800/40 hover:text-white"
          }
        `}
      >
        <span className="flex items-center gap-3">
          {Icon ? <Icon size={18} /> : <span className="w-[18px]" />}
          <span>{label}</span>
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-1 ml-3 space-y-1 border-l border-purple-700/40 pl-3">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  block px-3 py-2 rounded-md transition
                  ${
                    active
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:bg-purple-800/30 hover:text-white"
                  }
                `}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}