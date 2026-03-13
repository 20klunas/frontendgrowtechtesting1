import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL;

async function checkGlobalMaintenance(request, pathname) {
  if (!API) return null;

  const isInternalPath =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml";

  if (isInternalPath) return null;

  const isMaintenanceRoute = pathname.startsWith("/maintenance");
  if (isMaintenanceRoute) return null;

  try {

    const res = await fetch(`${API}/api/v1/maintenance/global-check`, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 10 },
    });

    if (res.status === 503) {
      const data = await res.json().catch(() => null);

      const message = encodeURIComponent(
        data?.error?.message || "Website sedang maintenance."
      );

      return NextResponse.redirect(
        new URL(`/maintenance?message=${message}`, request.url)
      );
    }

  } catch (err) {
    console.error("Global maintenance check failed:", err);
  }

  return null;
}

export async function middleware(request) {

  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value;
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isCustomerRoute = pathname.startsWith("/customer");
  const isProtectedRoute = isAdminRoute || isCustomerRoute;

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/verify-otp");

  const isMaintenanceRoute = pathname.startsWith("/maintenance");

  // AUTH GUARD
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ROLE GUARD
  if (isAdminRoute && token && role !== "admin") {
    return NextResponse.redirect(new URL("/customer", request.url));
  }

  if (isCustomerRoute && token && role === "admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // LOGIN PAGE WHEN AUTH
  if (isAuthRoute && token) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (role === "user" || role === "customer") {
      return NextResponse.redirect(new URL("/customer", request.url));
    }
  }

  // GLOBAL MAINTENANCE CHECK
  const maintenanceRedirect = await checkGlobalMaintenance(request, pathname);

  if (maintenanceRedirect) {
    return maintenanceRedirect;
  }

  // prevent access to maintenance page when normal
  if (isMaintenanceRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};