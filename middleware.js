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

if (
  pathname.startsWith("/_next") ||
  pathname.startsWith("/icons") ||
  pathname.startsWith("/images")
) {
  return NextResponse.next();
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

  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/maintenance") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  const publicMaintenance = await checkPublicMaintenance(request, pathname);
  if (publicMaintenance) return publicMaintenance;

  const userMaintenance = await checkUserAreaMaintenance(
    request,
    pathname,
    token
  );

  if (userMaintenance) return userMaintenance;

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};