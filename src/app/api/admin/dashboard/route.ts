import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminDashboard, isDatabaseConfigured } from "@/lib/db";
import { applyApiSecurityHeaders, consumeRateLimit, rateLimitResponse } from "@/lib/request-security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = consumeRateLimit(request, "admin-dashboard", 60, 60 * 1000);
  if (!limit.allowed) return rateLimitResponse(limit, "طلبات لوحة التحكم كثيرة حاليًا. حاول بعد قليل.");
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  }

  try {
    const response = NextResponse.json(await getAdminDashboard());
    return applyApiSecurityHeaders(response);
  } catch (error) {
    console.error("Admin dashboard error", error);
    return NextResponse.json({ error: "تعذر تحميل لوحة التحكم." }, { status: 500 });
  }
}
