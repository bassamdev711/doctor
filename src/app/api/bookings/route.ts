import { NextResponse } from "next/server";
import { claimRequestToken, createBooking, isDatabaseConfigured } from "@/lib/db";
import { bookingSchema } from "@/lib/validation";
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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSafeOrigin(request)) return securityError("مصدر الطلب غير مسموح.", 403);
  if (requestBodyTooLarge(request, 32 * 1024)) return securityError("حجم الطلب أكبر من المسموح.", 413);

  const limit = consumeRateLimit(request, "booking", 5, 10 * 60 * 1000);
  if (!limit.allowed) return rateLimitResponse(limit, "يمكن إرسال عدد محدود من طلبات المواعيد. حاول بعد قليل.");

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "لم يتم تهيئة قاعدة البيانات بعد." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const parsed = bookingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return securityError("يرجى مراجعة البيانات المدخلة.", 400);
    }

    if (parsed.data.website) {
      return NextResponse.json({ ok: true, message: "تم استلام الطلب." }, { status: 202, headers: { "Cache-Control": "no-store" } });
    }

    const bookingPayload = { ...parsed.data };
    const requestId = bookingPayload.requestId;
    delete bookingPayload.requestId;
    delete bookingPayload.website;
    const identity = getClientIp(request);
    const token = getIdempotencyKey(request) || requestId || createRequestToken("booking", identity, bookingPayload);
    const claimed = await claimRequestToken("booking", token, 30);
    if (!claimed) {
      return NextResponse.json({ error: "تم استلام هذا الطلب مسبقًا. سنتواصل معك قريبًا." }, { status: 409, headers: { "Cache-Control": "no-store" } });
    }

    const booking = await createBooking(bookingPayload);
    const response = NextResponse.json({ booking: { id: booking.id, status: booking.status } }, { status: 201 });
    return applyApiSecurityHeaders(response);
  } catch (error) {
    console.error("Booking creation error", error);
    return securityError("تعذر تسجيل الطلب الآن. يرجى الاتصال بالعيادة مباشرة.", 500);
  }
}
