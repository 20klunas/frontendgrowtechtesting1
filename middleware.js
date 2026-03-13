import { NextResponse } from "next/server"

export function middleware(request) {

  const token = request.cookies.get("token")?.value
  const { pathname } = request.nextUrl

  const maintenance = false

  /*
  =========================
  GLOBAL MAINTENANCE
  =========================
  */

  const isInternal =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"

  if (maintenance && !isInternal && pathname !== "/maintenance") {
    return NextResponse.redirect(new URL("/maintenance", request.url))
  }

  const isProtectedRoute =
    pathname.startsWith("/customer") ||
    pathname.startsWith("/admin")

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register"

  /*
  =========================
  BELUM LOGIN
  =========================
  */

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  /*
  =========================
  SUDAH LOGIN
  =========================
  */

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/customer", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
    Tangkap semua halaman
    kecuali asset static
    */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
}