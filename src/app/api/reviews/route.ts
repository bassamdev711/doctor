import { NextResponse } from "next/server";
import { claimRequestToken, createPendingReview, isDatabaseConfigured } from "@/lib/db";
import { publicReviewSchema } from "@/lib/validation";
import {
  applyApiSecurityHeaders,
  consumeRateLimit,
  createRequestToken,
  getClientIp,
  getIdempotencyKey,
  isSafeOrigin,
  rateLimitResponse,
  requestBodyTooLarge,
  securityError,
} from "@/lib/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSafeOrigin(request)) return securityError("مصدر الطلب غير مسموح.", 403);
  if (requestBodyTooLarge(request, 32 * 1024)) return securityError("حجم الطلب أكبر من المسموح.", 413);

  const limit = consumeRateLimit(request, "review", 3, 15 * 60 * 1000);
  if (!limit.allowed) return rateLimitResponse(limit, "يمكن إرسال عدد محدود من المراجعات. حاول لاحقًا.");

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "خدمة المراجعات غير مهيأة حاليًا." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const parsed = publicReviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return securityError(parsed.error.issues[0]?.message || "تحقق من البيانات المدخلة.", 400);
    }

    if (parsed.data.website) {
      return NextResponse.json({ ok: true, message: "تم استلام الطلب." }, { status: 202, headers: { "Cache-Control": "no-store" } });
    }

    const reviewPayload = { ...parsed.data };
    const requestId = reviewPayload.requestId;
    delete reviewPayload.requestId;
    delete reviewPayload.website;
    const identity = getClientIp(request);
    const token = getIdempotencyKey(request) || requestId || createRequestToken("review", identity, reviewPayload);
    const claimed = await claimRequestToken("review", token, 60);
    if (!claimed) {
      return NextResponse.json({ error: "تم استلام هذه المراجعة مسبقًا." }, { status: 409, headers: { "Cache-Control": "no-store" } });
    }

    try {
      const review = await createPendingReview(reviewPayload);
      const response = NextResponse.json({ id: review?.id, status: "pending", message: "تم استلام تجربتك بنجاح." }, { status: 201 });
      return applyApiSecurityHeaders(response);
    } catch (error) {
      if (error instanceof Error && error.message === "REVIEW_SERVICE_NOT_FOUND") {
        return securityError("اختر خدمة موجودة في العيادة.", 422);
      }
      throw error;
    }
  } catch (error) {
    console.error("Public review submission failed", error);
    return securityError("تعذر إرسال المراجعة الآن. حاول مرة أخرى لاحقًا.", 500);
  }
}

export function GET() {
  return NextResponse.json({ error: "استخدم POST لإرسال مراجعة." }, { status: 405, headers: { "Cache-Control": "no-store", Allow: "POST" } });
}
