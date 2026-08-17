import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { updateBookingStatus } from "@/lib/db";
import { bookingStatusSchema } from "@/lib/validation";
import { adminMutationGuard } from "@/lib/request-security";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = adminMutationGuard(request, "bookings-write");
  if (guard) return guard;
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const { id } = await context.params;
    const payload = bookingStatusSchema.parse(await request.json());
    const booking = await updateBookingStatus(Number(id), payload.status, payload.notes);
    if (!booking) return NextResponse.json({ error: "الحجز غير موجود." }, { status: 404 });
    return NextResponse.json({ booking });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "الحالة غير صالحة." }, { status: 400 });
    console.error("Update booking error", error);
    return NextResponse.json({ error: "تعذر تحديث الحجز." }, { status: 500 });
  }
}
