import { NextResponse } from "next/server";
import { createAdminSession, hasAdminCredentials, verifyAdminCredentials } from "@/lib/admin-auth";
import {
  applyApiSecurityHeaders,
  consumeRateLimit,
  isSafeOrigin,
  rateLimitResponse,
  requestBodyTooLarge,
  securityError,
} from "@/lib/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSafeOrigin(request)) return securityError("مصدر الطلب غير مسموح.", 403);
  if (requestBodyTooLarge(request, 16 * 1024)) return securityError("حجم الطلب أكبر من المسموح.", 413);

  const limit = consumeRateLimit(request, "admin-login", 6, 15 * 60 * 1000);
  if (!limit.allowed) return rateLimitResponse(limit, "تم تعليق محاولات الدخول مؤقتًا للحماية. حاول لاحقًا.");

  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "بيانات دخول لوحة التحكم غير مضافة في Vercel بعد." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!verifyAdminCredentials(email, password)) {
      return securityError("بيانات الدخول غير صحيحة.", 401);
    }

    await createAdminSession();
    const response = NextResponse.json({ ok: true });
    return applyApiSecurityHeaders(response);
  } catch (error) {
    console.error("Admin login error", error);
    return securityError("تعذر تسجيل الدخول الآن.", 500);
  }
}
