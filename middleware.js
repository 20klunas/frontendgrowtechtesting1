import { NextResponse } from "next/server"

export function middleware(request) {

  const token = request.cookies.get("token")?.value
  const role = request.cookies.get("role")?.value
  const { pathname } = request.nextUrl

  /*
  ==========================================================
  MAINTENANCE MODE
  ==========================================================
  */
  const maintenance = true

  /*
  ==========================================================
  ROUTE DASAR
  ==========================================================
  */

  const isAdminRoute = pathname.startsWith("/admin")
  const isCustomerRoute = pathname.startsWith("/customer")

  const isProtectedRoute = isAdminRoute || isCustomerRoute

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register"

  /*
  ==========================================================
  ROUTE YANG BOLEH SAAT MAINTENANCE
  ==========================================================
  */

  const maintenanceAllowedRoutes = [
    "/maintenance",
    "/login",
    "/register",
    "/verify-otp"
  ]

  const allowedDuringMaintenance =
    maintenanceAllowedRoutes.some(route => pathname.startsWith(route))

  /*
  ==========================================================
  INTERNAL / STATIC PATH
  ==========================================================
  */

  const isInternalPath =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"

  /*
  ==========================================================
  OPTIONAL ADMIN BYPASS
  ==========================================================
  */

  const allowAdminBypass = false

  /*
  ==========================================================
  GLOBAL MAINTENANCE
  ==========================================================
  */

  if (
    maintenance &&
    !allowedDuringMaintenance &&
    !isInternalPath &&
    !(allowAdminBypass && role === "admin")
  ) {
    return NextResponse.redirect(new URL("/maintenance", request.url))
  }

  /*
  ==========================================================
  AUTH GUARD
  ==========================================================
  */

  if (!maintenance && isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  /*
  ==========================================================
  SUDAH LOGIN
  ==========================================================
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