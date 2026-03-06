import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const routePermissions = {
  dashboard: "view_dashboard",

  kategori: "manage_categories",
  "sub-kategori": "manage_subcategories",
  produk: "manage_products",

  pengguna: "manage_users",
  datatransaksi: "manage_orders",
  datadeposit: "manage_wallets",
  voucher: "manage_vouchers",
  referral: "manage_referrals",

  konfigurasi: "manage_site_settings",
  konten: "manage_pages",
  "akses-admin": "manage_admins",
}

export function middleware(req) {
  const token = req.cookies.get("token")?.value

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const decoded = jwt.decode(token)
  const permissions = decoded?.permissions || []

  const path = req.nextUrl.pathname.split("/")[2]

  const requiredPermission = routePermissions[path]

  if (
    requiredPermission &&
    !permissions.includes(requiredPermission) &&
    !permissions.includes("*")
  ) {
    return NextResponse.rewrite(new URL("/admin/404", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}