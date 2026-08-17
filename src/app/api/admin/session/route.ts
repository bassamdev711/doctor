import { NextResponse } from "next/server";
import { hasAdminCredentials, isAdminAuthenticated } from "@/lib/admin-auth";
import { applyApiSecurityHeaders, consumeRateLimit, rateLimitResponse } from "@/lib/request-security";

export async function GET(request: Request) {
  const limit = consumeRateLimit(request, "admin-session", 60, 60 * 1000);
  if (!limit.allowed) return rateLimitResponse(limit, "طلبات الجلسة كثيرة حاليًا. حاول بعد قليل.");
  const response = NextResponse.json({ configured: hasAdminCredentials(), authenticated: await isAdminAuthenticated() });
  return applyApiSecurityHeaders(response);
}
