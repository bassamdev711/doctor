import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "dental_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL || "",
    password: process.env.ADMIN_PASSWORD || "",
  };
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(digest(left));
  const rightBuffer = Buffer.from(digest(right));
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getSessionToken() {
  const { email, password } = getAdminCredentials();
  if (!email || !password) return "";
  return digest(`${email}:${password}:${process.env.AUTH_SECRET || password}`);
}

export function hasAdminCredentials() {
  const { email, password } = getAdminCredentials();
  return Boolean(email && password);
}

export function verifyAdminCredentials(email: string, password: string) {
  const configured = getAdminCredentials();
  return Boolean(configured.email && configured.password && safeEqual(email, configured.email) && safeEqual(password, configured.password));
}

export async function isAdminAuthenticated() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return Boolean(token && safeEqual(token, getSessionToken()));
}

export async function createAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, getSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    throw new Error("UNAUTHORIZED");
  }
}
