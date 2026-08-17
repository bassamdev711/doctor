import { NextResponse } from "next/server";
import { getPublicContent, isDatabaseConfigured } from "@/lib/db";
import { applyApiSecurityHeaders, consumeRateLimit, rateLimitResponse } from "@/lib/request-security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = consumeRateLimit(request, "public-content", 120, 60 * 1000);
  if (!limit.allowed) return rateLimitResponse(limit, "الطلبات كثيرة حاليًا. حاول بعد قليل.");

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "قاعدة البيانات غير مهيأة بعد." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const response = NextResponse.json(await getPublicContent());
    return applyApiSecurityHeaders(response);
  } catch (error) {
    console.error("Public content error", error);
    return NextResponse.json({ error: "تعذر تحميل محتوى العيادة." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
