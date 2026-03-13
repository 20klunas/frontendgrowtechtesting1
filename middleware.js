import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value;
  const { pathname } = request.nextUrl;

  /*
  ==========================================================
  MAINTENANCE MODE
  ==========================================================
  Ambil dari ENV agar tidak hardcode true/false di source code.
  Default = false
  ==========================================================
  */
  const maintenance =
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

  /*
  ==========================================================
  OPTIONAL ADMIN BYPASS
  ==========================================================
  Jika true, admin tetap boleh masuk saat maintenance aktif.
  ==========================================================
  */
  const allowAdminBypass =
    process.env.NEXT_PUBLIC_MAINTENANCE_ADMIN_BYPASS === "true";

  /*
  ==========================================================
  ROUTE GROUPS
  ==========================================================
  */
  const isAdminRoute = pathname.startsWith("/admin");
  const isCustomerRoute = pathname.startsWith("/customer");

  const isProtectedRoute = isAdminRoute || isCustomerRoute;

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register";

  const isOtpRoute = pathname.startsWith("/verify-otp");
  const isMaintenanceRoute = pathname.startsWith("/maintenance");

  /*
  ==========================================================
  ROUTE YANG BOLEH DIAKSES SAAT MAINTENANCE
  ==========================================================
  - maintenance page
  - login / register
  - verify otp
  ==========================================================
  */
  const maintenanceAllowedRoutes = [
    "/maintenance",
    "/login",
    "/register",
    "/verify-otp",
  ];

  const allowedDuringMaintenance = maintenanceAllowedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  /*
  ==========================================================
  INTERNAL / STATIC PATH
  ==========================================================
  */
  const isInternalPath =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml";

  /*
  ==========================================================
  GLOBAL MAINTENANCE
  ==========================================================
  Jika maintenance aktif:
  - route selain yang diizinkan akan diarahkan ke /maintenance
  - admin bisa bypass jika allowAdminBypass = true dan role=admin
  ==========================================================
  */
  if (
    maintenance &&
    !allowedDuringMaintenance &&
    !isInternalPath &&
    !(allowAdminBypass && role === "admin")
  ) {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  /*
  ==========================================================
  AUTH GUARD
  ==========================================================
  Jika route protected tapi belum login -> ke /login
  ==========================================================
  */
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  /*
  ==========================================================
  ROLE GUARD
  ==========================================================
  - /admin hanya untuk admin
  - /customer untuk user/customer biasa
  ==========================================================
  */
  if (isAdminRoute && token && role !== "admin") {
    return NextResponse.redirect(new URL("/customer", request.url));
  }

  if (isCustomerRoute && token && role === "admin") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  /*
  ==========================================================
  SUDAH LOGIN TIDAK PERLU KE LOGIN/REGISTER LAGI
  ==========================================================
  */
  if (isAuthRoute && token) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.redirect(new URL("/customer", request.url));
  }

  /*
  ==========================================================
  OTP ROUTE
  ==========================================================
  - route /verify-otp boleh diakses walau token belum ada
  - kalau user sudah login penuh dan coba buka OTP lagi,
    arahkan ke dashboard sesuai role
  ==========================================================
  */
  if (isOtpRoute && token) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.redirect(new URL("/customer", request.url));
  }

  /*
  ==========================================================
  MAINTENANCE PAGE
  ==========================================================
  Jika maintenance off tapi user buka /maintenance manual,
  arahkan ke home
  ==========================================================
  */
  if (!maintenance && isMaintenanceRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};