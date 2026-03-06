'use client'
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { adminMenu } from "../../rbac/adminMenu"
import { usePermission } from "../../hooks/usePermission"
import {
  LayoutDashboard,
  Package,
  Layers,
  Users,
  CreditCard,
  Wallet,
  Ticket,
  Share2,
  Settings,
  FileText,
  LogOut
} from "lucide-react";

const mainMenus = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  // { label: "Produk", href: "/admin/produk", icon: Package },
  // { label: "Kategori", href: "/admin/kategori", icon: Layers },
];


const managementMenus = [
  { label: "Pengguna", href: "/admin/pengguna", icon: Users },
  { label: "Transaksi", href: "/admin/datatransaksi", icon: CreditCard },
  { label: "Deposit", href: "/admin/datadeposit", icon: Wallet },
  { label: "Voucher", href: "/admin/voucher", icon: Ticket },
  { label: "Referral", href: "/admin/referral", icon: Share2 },
];

const systemMenus = [
  { label: "Konfigurasi", href: "/admin/konfigurasi", icon: Settings },
  { label: "Konten", href: "/admin/konten", icon: FileText },
];


export default function AdminSidebar({ open, setOpen, collapsed }) {
  const pathname = usePathname();
  const { can } = usePermission()

  {adminMenu.map(group => {

    const visibleItems = group.items?.filter(
      item => !item.permission || can(item.permission)
    )

    if (visibleItems?.length === 0) return null

    return (
      <SidebarGroup key={group.group} title={group.group}>

        {visibleItems.map(menu => (
          <SidebarItem
            key={menu.href}
            label={menu.label}
            href={menu.href}
            icon={menu.icon}
            pathname={pathname}
          />
        ))}

      </SidebarGroup>
    )
  })}

  return (
    <>
      {/* MOBILE OVERLAY */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed left-0 top-14 z-40 mb-0 
          h-[calc(100vh-56px)]
          ${collapsed ? "w-20" : "w-64"}
          bg-gradient-to-b from-[#2a0446] to-[#12001f]
          border-r border-purple-800/40
          transition-all duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >

        {/* BRAND */}
        {/* <div className="px-6 py-6 border-b border-purple-800/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-trasparent flex items-center justify-center shadow-md overflow-hidden">
              <Image
                src="/logoherosection.png"
                alt="Growtech Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="font-semibold leading-tight">Growtech</div>
              <div className="text-xs text-purple-300">Admin Panel</div>
            </div>
          </div>
        </div> */}

        {/* USER PANEL */}
        {/* <div className="px-6 py-4 border-b border-purple-800/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-700 flex items-center justify-center text-sm">
              👤
            </div>
            <div>
              <div className="text-sm font-medium">Ravi</div>
              <div className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                Online
              </div>
            </div>
          </div>
        </div> */}

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-5 pb-24 space-y-6 text-sm">

          <SidebarGroup title="Main Navigation">
            {mainMenus.map(menu => (
              <SidebarItem
                key={menu.label}
                {...menu}
                pathname={pathname}
              />
            ))}

            <SidebarDropdown
              label="Manajemen Produk"
              icon={Package}
              pathname={pathname}
              items={[
                { label: "Kategori", href: "/admin/kategori" },
                { label: "Sub Kategori", href: "/admin/sub-kategori" },
                { label: "Produk", href: "/admin/produk" },
              ]}
            />
          </SidebarGroup>

          <SidebarGroup title="Management">
            {managementMenus.map(menu => (
              <SidebarItem
                key={menu.label}
                {...menu}
                pathname={pathname}
              />
            ))}
          </SidebarGroup>

          <SidebarGroup title="System">
            {systemMenus.map(menu => (
              <SidebarItem
                key={menu.label}
                {...menu}
                pathname={pathname}
              />
            ))}
          </SidebarGroup>


        </nav>
{/* 
        <div className="px-3 py-4 border-t border-purple-800/40 mt-0">
          <button
            className="
              w-full flex items-center gap-3
              px-4 py-2.5 rounded-lg
              text-red-400 hover:bg-red-500/10
              transition
            "
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div> */}

        {/* FOOTER */}
        {/* <div className="px-6 py-4 border-t border-purple-800/40 text-xs text-purple-300">
          © 2026 Growtech
        </div> */}

      </aside>
    </>
  );
}

/* ================= COMPONENT ================= */

function SidebarGroup({ title, children }) {
  return (
    <div>
      <div className="px-3 mb-2 text-[10px] tracking-widest text-purple-300/60 font-semibold uppercase">
        {title}
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

function SidebarItem({ label, href, icon: Icon, pathname, collapsed }) {
  const active = pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`
        relative group flex items-center gap-3
        px-4 py-2.5 rounded-lg
        transition-all duration-200
        ${active
          ? "bg-purple-600 text-white shadow-sm shadow-purple-900/30"
          : "text-gray-300 hover:bg-purple-800/40 hover:text-white"}
      `}
    >
      {/* ACTIVE INDICATOR */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-purple-400" />
      )}

      <Icon
        size={18}
        className="
          transition-transform duration-200
          group-hover:scale-110
          group-hover:rotate-[360deg]
        "
      />

      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}

function SidebarDropdown({ label, icon: Icon, items, pathname }) {
  const isActive = items.some(item => pathname.startsWith(item.href));
  const [open, setOpen] = useState(isActive);

  useEffect(() => {
    if (isActive) setOpen(true);
  }, [isActive]);

  return (
    <div>
      {/* PARENT */}
      <button
        onClick={() => setOpen(!open)}
        className={`
          w-full flex items-center justify-between
          px-4 py-2.5 rounded-lg
          transition
          ${isActive
            ? "bg-purple-600 text-white"
            : "text-gray-300 hover:bg-purple-800/40 hover:text-white"}
        `}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} />
          <span>{label}</span>
        </div>

        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* CHILD */}
      {open && (
        <div
          className={`
            mt-1 ml-8 space-y-1 pb-2
            overflow-hidden
            transition-all duration-300
            ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}
          `}
        >
          {items.map(item => {
            const active = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  block px-3 py-2 rounded-md text-sm
                  transition
                  ${active
                    ? "bg-purple-700 text-white"
                    : "text-gray-300 hover:bg-purple-800/40"}
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}