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
  INTERNAL / STATIC PATH
  ==========================================================
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
    /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|map|txt|xml|woff|woff2|ttf|otf)$/i.test(pathname)

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

  const isOtpRoute = pathname.startsWith("/verify-otp")

  const allowedDuringMaintenance =
    pathname === "/maintenance" ||
    pathname === "/login" ||
    pathname === "/register" ||
    isOtpRoute

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
    !allowAdminBypass
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