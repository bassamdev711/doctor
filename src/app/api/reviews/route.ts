import { NextResponse } from "next/server";
import { createPendingReview, isDatabaseConfigured } from "@/lib/db";
import { publicReviewSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "خدمة المراجعات غير مهيأة حاليًا." }, { status: 503 });
  }

  try {
    const payload = await request.json();
    const parsed = publicReviewSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "تحقق من البيانات المدخلة." }, { status: 400 });
    }

    const review = await createPendingReview(parsed.data);
    return NextResponse.json({ id: review?.id, status: "pending", message: "تم استلام مراجعتك. ستظهر بعد اعتماد فريق العيادة." }, { status: 201 });
  } catch (error) {
    console.error("Public review submission failed", error);
    return NextResponse.json({ error: "تعذر إرسال المراجعة الآن. حاول مرة أخرى لاحقًا." }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: "استخدم POST لإرسال مراجعة." }, { status: 405 });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
