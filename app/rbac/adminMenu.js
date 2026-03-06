import {
  LayoutDashboard,
  Package,
  Users,
  CreditCard,
  Wallet,
  Ticket,
  Share2,
  Settings,
  FileText,
  ShieldCheck,
} from "lucide-react"

export const adminMenu = [
  {
    group: "Main Navigation",
    items: [
      {
        label: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        permission: "view_dashboard",
      },
    ],
  },

  {
    group: "Manajemen Produk",
    dropdown: true,
    icon: Package,
    items: [
      {
        label: "Kategori",
        href: "/admin/kategori",
        permission: "manage_categories",
      },
      {
        label: "Sub Kategori",
        href: "/admin/sub-kategori",
        permission: "manage_subcategories",
      },
      {
        label: "Produk",
        href: "/admin/produk",
        permission: "manage_products",
      },
    ],
  },

  {
    group: "Management",
    items: [
      {
        label: "Pengguna",
        href: "/admin/pengguna",
        icon: Users,
        permission: "manage_users",
      },
      {
        label: "Transaksi",
        href: "/admin/datatransaksi",
        icon: CreditCard,
        permission: "manage_orders",
      },
      {
        label: "Deposit",
        href: "/admin/datadeposit",
        icon: Wallet,
        permission: "manage_wallets",
      },
      {
        label: "Voucher",
        href: "/admin/voucher",
        icon: Ticket,
        permission: "manage_vouchers",
      },
      {
        label: "Referral",
        href: "/admin/referral",
        icon: Share2,
        permission: "manage_referrals",
      },
    ],
  },

  {
    group: "System",
    items: [
      {
        label: "Konfigurasi",
        href: "/admin/konfigurasi",
        icon: Settings,
        permission: "manage_site_settings",
      },
      {
        label: "Konten",
        href: "/admin/konten",
        icon: FileText,
        permission: "manage_pages",
      },
      {
        label: "Akses Admin",
        href: "/admin/akses-admin",
        icon: ShieldCheck,
        permission: "manage_admins",
      },
    ],
  },
]