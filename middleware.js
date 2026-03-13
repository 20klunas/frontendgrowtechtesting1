import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL;

async function checkBackendMaintenance({ request, token, role, pathname }) {
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

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/verify-otp");

  if (isAuthRoute) return null;

  const isAdminRoute = pathname.startsWith("/admin");
  const isCustomerRoute = pathname.startsWith("/customer");

  if (role === "admin" && isAdminRoute) {
    return null;
  }

  try {

    // CUSTOMER AREA CHECK
    if (isCustomerRoute && token) {
      const res = await fetch(`${API}/api/v1/user/maintenance-check`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 5 },
      });

      if (res.status === 503) {
        const data = await res.json().catch(() => null);

        const message = encodeURIComponent(
          data?.error?.message || "Area customer sedang maintenance."
        );

        const scope = encodeURIComponent(data?.meta?.scope || "user");
        const key = encodeURIComponent(data?.meta?.key || "user_area_access");

        return NextResponse.redirect(
          new URL(
            `/maintenance?scope=${scope}&key=${key}&message=${message}`,
            request.url
          )
        );
      }

      return null;
    }

    // PUBLIC AREA CHECK
    if (!isAdminRoute && !isCustomerRoute && !isMaintenanceRoute) {
      const res = await fetch(`${API}/api/v1/maintenance/public-check`, {
        method: "GET",
        headers: { Accept: "application/json" },
        next: { revalidate: 5 },
      });

      if (res.status === 503) {
        const data = await res.json().catch(() => null);

        const message = encodeURIComponent(
          data?.error?.message || "Halaman publik sedang maintenance."
        );

        const scope = encodeURIComponent(data?.meta?.scope || "public");
        const key = encodeURIComponent(data?.meta?.key || "public_access");

        return NextResponse.redirect(
          new URL(
            `/maintenance?scope=${scope}&key=${key}&message=${message}`,
            request.url
          )
        );
      }
    }

  } catch (error) {
    console.error("Maintenance check failed:", error);
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

  // LOGIN PAGE WHEN ALREADY AUTH
  if (isAuthRoute && token) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (role === "user" || role === "customer") {
      return NextResponse.redirect(new URL("/customer", request.url));
    }
  }

  // BACKEND MAINTENANCE CHECK
  const maintenanceRedirect = await checkBackendMaintenance({
    request,
    token,
    role,
    pathname,
  });

  if (maintenanceRedirect) {
    return maintenanceRedirect;
  }

  // PREVENT ACCESS TO MAINTENANCE PAGE WHEN NORMAL
  if (isMaintenanceRoute) {
    try {
      const res = await fetch(`${API}/api/v1/maintenance/public-check`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 5 },
      });

      // kalau backend sudah normal → keluar dari maintenance
      if (res.ok) {
        return NextResponse.redirect(new URL("/", request.url));
      }

    } catch (error) {
      console.error("Maintenance recheck failed:", error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};