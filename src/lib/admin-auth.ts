import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL || "",
    password: process.env.ADMIN_PASSWORD || "",
  };
}

function getSigningSecret() {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "";
}

function getSessionCookieName() {
  return process.env.NODE_ENV === "production" ? "__Host-dental_admin_session" : "dental_admin_session";
}

function digest(value: string) {
  return createHmac("sha256", getSigningSecret() || "dental-dev-secret").update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function getSessionToken() {
  const { email, password } = getAdminCredentials();
  const secret = getSigningSecret();
  if (!email || !password || !secret) return "";
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${email}:${expiresAt}:${randomBytes(24).toString("hex")}`;
  return `${payload}.${digest(payload)}`;
}

function isValidSessionToken(token: string) {
  const secret = getSigningSecret();
  const { email } = getAdminCredentials();
  if (!token || !email || !secret) return false;
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const [tokenEmail, expiresAtText] = payload.split(":");
  const expiresAt = Number(expiresAtText);
  if (tokenEmail !== email || !Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;
  return safeEqual(signature, digest(payload));
}

export function hasAdminCredentials() {
  const { email, password } = getAdminCredentials();
  return Boolean(email && password && getSigningSecret());
}

export function verifyAdminCredentials(email: string, password: string) {
  const configured = getAdminCredentials();
  return Boolean(configured.email && configured.password && safeEqual(email, configured.email) && safeEqual(password, configured.password));
}

export async function isAdminAuthenticated() {
  const token = (await cookies()).get(getSessionCookieName())?.value || "";
  return isValidSessionToken(token);
}

export async function createAdminSession() {
  const token = getSessionToken();
  if (!token) throw new Error("ADMIN_AUTH_NOT_CONFIGURED");
  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    throw new Error("UNAUTHORIZED");
  }
}
