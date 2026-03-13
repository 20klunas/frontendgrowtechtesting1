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

  const isAdminRoute = pathname.startsWith("/admin");
  const isCustomerRoute = pathname.startsWith("/customer");

  if (role === "admin" && isAdminRoute) {
    return null;
  }

  try {
    if (isCustomerRoute && token) {
      const res = await fetch(`${API}/api/v1/user/maintenance-check`, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
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

    if (!isAdminRoute && !isCustomerRoute && !isAuthRoute) {
      const res = await fetch(`${API}/api/v1/maintenance/public-check`, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
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
    pathname === "/register";

  const isOtpRoute = pathname.startsWith("/verify-otp");
  const isMaintenanceRoute = pathname.startsWith("/maintenance");

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAdminRoute && token && role !== "admin") {
    return NextResponse.redirect(new URL("/customer", request.url));
  }

  if (isCustomerRoute && token && role === "admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  if (isAuthRoute && token) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (role === "user" || role === "customer") {
      return NextResponse.redirect(new URL("/customer", request.url));
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isOtpRoute && token) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (role === "user" || role === "customer") {
      return NextResponse.redirect(new URL("/customer", request.url));
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  const maintenanceRedirect = await checkBackendMaintenance({
    request,
    token,
    role,
    pathname,
  });

  if (maintenanceRedirect) {
    return maintenanceRedirect;
  }

  if (isMaintenanceRoute) {
    try {
      const publicRes = await fetch(`${API}/api/v1/maintenance/public-check`, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (publicRes.ok) {
        if (token && (role === "user" || role === "customer")) {
          const userRes = await fetch(`${API}/api/v1/user/maintenance-check`, {
            method: "GET",
            cache: "no-store",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (userRes.ok) {
            return NextResponse.redirect(new URL("/customer", request.url));
          }
        } else {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
    } catch (error) {
      console.error("Maintenance page re-check failed:", error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};