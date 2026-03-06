import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"

/*
|--------------------------------------------------------------------------
| Admin Route Permission Mapping
|--------------------------------------------------------------------------
*/
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

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/
export function middleware(request) {
  const token = request.cookies.get("token")?.value
  const { pathname } = request.nextUrl

  /*
  |--------------------------------------------------------------------------
  | Auth Route Check
  |--------------------------------------------------------------------------
  */

  const isProtectedRoute =
    pathname.startsWith("/customer") ||
    pathname.startsWith("/admin")

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register"

  /*
  |--------------------------------------------------------------------------
  | Redirect if not logged in
  |--------------------------------------------------------------------------
  */

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  /*
  |--------------------------------------------------------------------------
  | Redirect if already logged in
  |--------------------------------------------------------------------------
  */

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/customer", request.url))
  }

  /*
  |--------------------------------------------------------------------------
  | Admin RBAC Permission Check
  |--------------------------------------------------------------------------
  */

  if (pathname.startsWith("/admin")) {

    const decoded = jwt.decode(token)
    const permissions = decoded?.permissions || []

    const path = pathname.split("/")[2]

    const requiredPermission = routePermissions[path]

    if (
      requiredPermission &&
      !permissions.includes(requiredPermission) &&
      !permissions.includes("*")
    ) {
      return NextResponse.redirect(new URL("/admin/not-found", request.url))
    }
  }

  return NextResponse.next()
}

/*
|--------------------------------------------------------------------------
| Middleware Matcher
|--------------------------------------------------------------------------
*/

export const config = {
  matcher: [
    "/customer/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
}