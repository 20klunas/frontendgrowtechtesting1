import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value;
  const { pathname } = request.nextUrl;

  /*
  ==========================================================
  MAINTENANCE MODE
  ==========================================================
  NEXT_PUBLIC_MAINTENANCE_MODE=true/false
  NEXT_PUBLIC_MAINTENANCE_ADMIN_BYPASS=true/false
  ==========================================================
  */
  const maintenance =
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

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
  */
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  /*
  ==========================================================
  ROLE GUARD
  ==========================================================
  */
  if (isAdminRoute && token && role !== "admin") {
    return NextResponse.redirect(new URL("/customer", request.url));
  }

  if (isCustomerRoute && token && role === "admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  /*
  ==========================================================
  LOGIN / REGISTER JIKA SUDAH LOGIN
  ==========================================================
  */
  if (isAuthRoute && token) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (role === "user" || role === "customer") {
      return NextResponse.redirect(new URL("/customer", request.url));
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  /*
  ==========================================================
  OTP PAGE JIKA SUDAH LOGIN PENUH
  ==========================================================
  */
  if (isOtpRoute && token) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (role === "user" || role === "customer") {
      return NextResponse.redirect(new URL("/customer", request.url));
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  /*
  ==========================================================
  MAINTENANCE PAGE SAAT MAINTENANCE OFF
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