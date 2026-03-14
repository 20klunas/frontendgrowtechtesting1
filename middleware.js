import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL;

const REDIRECT_KEYS = new Set([
  "public_access",
  "user_area_access",
  "user_auth_access",
]);

function isInternalPath(pathname) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

function buildMaintenanceRedirectPath(data) {
  const message = encodeURIComponent(
    data?.error?.message || "Website sedang maintenance."
  );

  const scope = encodeURIComponent(
    data?.meta?.scope || "system"
  );

  const key = encodeURIComponent(
    data?.meta?.key || "maintenance"
  );

  return `/maintenance?scope=${scope}&key=${key}&message=${message}`;
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function checkPublicMaintenance(request, pathname) {
  if (!API) return null;
  if (isInternalPath(pathname)) return null;
  if (pathname.startsWith("/maintenance")) return null;
  if (pathname.startsWith("/admin")) return null;
  if (pathname.startsWith("/customer")) return null;

  const isAuthLikeRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/verify-otp") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/oauth-success");

  if (isAuthLikeRoute) return null;

  try {
    // sentinel public_access
    const res = await fetch(`${API}/api/v1/content/settings?group=website`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (res.status !== 503) return null;

    const data = await safeJson(res);
    const key = data?.meta?.key || "public_access";

    if (!REDIRECT_KEYS.has(key)) return null;

    return NextResponse.redirect(
      new URL(buildMaintenanceRedirectPath(data), request.url)
    );
  } catch (error) {
    console.error("Public maintenance check failed:", error);
    return null;
  }
}

async function checkUserAreaMaintenance(request, pathname, token, role) {
  if (!API) return null;
  if (!pathname.startsWith("/customer")) return null;
  if (!token) return null;
  if (role === "admin") return null;

  try {
    // sentinel user_area_access
    const res = await fetch(`${API}/api/v1/wallet/summary`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status !== 503) return null;

    const data = await safeJson(res);
    const key = data?.meta?.key || "user_area_access";

    if (key !== "user_area_access") return null;

    return NextResponse.redirect(
      new URL(buildMaintenanceRedirectPath(data), request.url)
    );
  } catch (error) {
    console.error("User area maintenance check failed:", error);
    return null;
  }
}

export async function middleware(request) {
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value;
  const { pathname } = request.nextUrl;

  // STOP middleware logic untuk maintenance page
  if (pathname.startsWith("/maintenance")) {
    return NextResponse.next();
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isCustomerRoute = pathname.startsWith("/customer");
  const isProtectedRoute = isAdminRoute || isCustomerRoute;

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register";

  const isOtpRoute = pathname.startsWith("/verify-otp");
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

  // LOGIN / REGISTER JIKA SUDAH LOGIN
  if (isAuthRoute && token) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (role === "user" || role === "customer") {
      return NextResponse.redirect(new URL("/customer", request.url));
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  // OTP PAGE JIKA SUDAH LOGIN PENUH
  if (isOtpRoute && token) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (role === "user" || role === "customer") {
      return NextResponse.redirect(new URL("/customer", request.url));
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  // FULL PUBLIC MAINTENANCE
  const publicMaintenance = await checkPublicMaintenance(request, pathname);
  if (publicMaintenance) return publicMaintenance;

  // FULL USER AREA MAINTENANCE
  const userMaintenance = await checkUserAreaMaintenance(
    request,
    pathname,
    token,
    role
  );
  if (userMaintenance) return userMaintenance;

  // kalau buka /maintenance saat normal, balikkan
  if (isMaintenanceRoute && API) {
    try {
      const publicRes = await fetch(`${API}/api/v1/content/settings?group=website`, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      const publicStillMaintenance = publicRes.status === 503;

      if (!publicStillMaintenance) {
        if (token && (role === "user" || role === "customer")) {
          const userRes = await fetch(`${API}/api/v1/wallet/summary`, {
            method: "GET",
            cache: "no-store",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const userStillMaintenance = userRes.status === 503;

          if (!userStillMaintenance) {
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