import { NextResponse } from "next/server";
import { createBooking, isDatabaseConfigured } from "@/lib/db";
import { bookingSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "لم يتم تهيئة قاعدة البيانات بعد." }, { status: 503 });
  }

  try {
    const payload = bookingSchema.parse(await request.json());
    const booking = await createBooking(payload);
    return NextResponse.json({ booking: { id: booking.id, status: booking.status } }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "يرجى مراجعة البيانات المدخلة." }, { status: 400 });
    }
    console.error("Booking creation error", error);
    return NextResponse.json({ error: "تعذر تسجيل الطلب الآن. يرجى الاتصال بالعيادة مباشرة." }, { status: 500 });
  }
}
