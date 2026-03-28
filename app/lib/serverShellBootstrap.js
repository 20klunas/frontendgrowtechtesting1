import { cookies } from "next/headers";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

// ================= BUILD URL =================
function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!API) {
    return normalizedPath;
  }

  if (API.endsWith("/api/v1") && normalizedPath.startsWith("/api/v1")) {
    return `${API}${normalizedPath.replace(/^\/api\/v1/, "")}`;
  }

  return `${API}${normalizedPath}`;
}

// ================= SAFE PARSE =================
async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// ================= TOKEN =================
async function getServerToken() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("token")?.value || "";
  } catch {
    return "";
  }
}

// ================= MAIN =================
export async function getServerShellBootstrap() {
  const token = await getServerToken();

  // kalau gak ada API atau token → skip
  if (!API || !token) {
    return null;
  }

  try {
    const response = await fetch(buildApiUrl("/api/v1/bootstrap/shell"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      revalidate: 10,
    });

    const payload = await parseJsonSafe(response);

    if (!response.ok) {
      return null;
    }

    return payload?.data || null;
  } catch (err) {
    console.error("Bootstrap fetch error:", err);
    return null;
  }
}