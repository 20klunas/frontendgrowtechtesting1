import { NextResponse } from "next/server"

export function middleware(request) {
  const token = request.cookies.get("token")?.value
  const role = request.cookies.get("role")?.value
  const { pathname } = request.nextUrl

  /**
   * =========================================================
   * MAINTENANCE MODE
   * =========================================================
   * true  = maintenance aktif
   * false = website normal
   */
  const maintenance = true

  /**
   * =========================================================
   * INTERNAL / STATIC PATH
   * =========================================================
   * Jangan diganggu agar asset tetap bisa di-load.
   */
  const isInternalPath =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/img") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/public") ||
    /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|map|txt|xml|woff|woff2|ttf|otf)$/i.test(
      pathname
    )

  /**
   * =========================================================
   * ROUTE DASAR
   * =========================================================
   */
  const isAdminRoute = pathname.startsWith("/admin")
  const isCustomerRoute = pathname.startsWith("/customer")
  const isProtectedRoute = isAdminRoute || isCustomerRoute
  const isAuthRoute = pathname === "/login" || pathname === "/register"

  /**
   * =========================================================
   * ROUTE YANG TETAP BOLEH SAAT MAINTENANCE
   * =========================================================
   * Login dan register tetap dibuka.
   */
  const allowedDuringMaintenance =
    pathname === "/maintenance" ||
    pathname === "/login" ||
    pathname === "/register"

  /**
   * =========================================================
   * OPTIONAL ADMIN BYPASS
   * =========================================================
   * Saat ini dimatikan.
   * Kalau nanti admin mau tetap bisa masuk saat maintenance,
   * ubah false menjadi:
   * const allowAdminBypass = token && role === "admin"
   */
  const allowAdminBypass = false

  /**
   * =========================================================
   * GLOBAL MAINTENANCE
   * =========================================================
   * Saat maintenance aktif:
   * - login boleh
   * - register boleh
   * - maintenance page boleh
   * - selain itu diarahkan ke /maintenance
   */
  if (
    maintenance &&
    !allowedDuringMaintenance &&
    !isInternalPath &&
    !allowAdminBypass
  ) {
    return NextResponse.redirect(new URL("/maintenance", request.url))
  }

  /**
   * =========================================================
   * AUTH GUARD
   * =========================================================
   * Hanya berjalan saat maintenance TIDAK aktif.
   */
  if (!maintenance && isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  /**
   * =========================================================
   * SUDAH LOGIN
   * =========================================================
   * User yang sudah login tidak perlu masuk login/register lagi.
   */
  if (!maintenance && isAuthRoute && token) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }

    return NextResponse.redirect(new URL("/customer", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
}