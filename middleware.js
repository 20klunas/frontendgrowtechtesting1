import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL;

function isInternalPath(pathname) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

function shouldSkipMaintenanceCheck(request, pathname) {
  const purpose = request.headers.get("purpose");
  const prefetch = request.headers.get("next-router-prefetch");

  if (request.method !== "GET") return true;
  if (purpose === "prefetch") return true;
  if (prefetch) return true;
  if (isInternalPath(pathname)) return true;

  return false;
}

function buildMaintenanceRedirectPath(data) {
  const message = encodeURIComponent(
    data?.error?.message || "Website sedang maintenance."
  );

  const scope = encodeURIComponent(data?.meta?.scope || "system");
  const key = encodeURIComponent(data?.meta?.key || "maintenance");

  return `/maintenance?scope=${scope}&key=${key}&message=${message}`;
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function checkUserAreaMaintenance(request, pathname, token, role) {
  if (!API) return null;
  if (!pathname.startsWith("/customer")) return null;
  if (!token) return null;
  if (role === "admin") return null;
  if (shouldSkipMaintenanceCheck(request, pathname)) return null;

  try {
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

  const isAdminRoute = pathname.startsWith("/admin");
  const isCustomerRoute = pathname.startsWith("/customer");
  const isProtectedRoute = isAdminRoute || isCustomerRoute;

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isOtpRoute = pathname.startsWith("/verify-otp");

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

  const userMaintenance = await checkUserAreaMaintenance(
    request,
    pathname,
    token,
    role
  );

  if (userMaintenance) {
    return userMaintenance;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};