// app/actions/auth.js
"use server";

import { cookies } from "next/headers";

export async function forgotPassword(formData) {
  const email = formData.get("email");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/password/forgot`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email }),
      cache: "no-store",
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Gagal");
  }

  return true;
}

export async function loginAction(formData) {
  const email = formData.get("email");
  const password = formData.get("password");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Login gagal");
  }

  const token = data?.data?.token;
  const user = data?.data?.user;

  if (!token || !user) {
    throw new Error("Data login tidak valid");
  }

  // simpan di server cookie (AMAN)
  cookies().set("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });

  cookies().set("role", user.role, {
    path: "/",
  });

  return user;
}