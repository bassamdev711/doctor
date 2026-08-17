import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteReview, updateReview } from "@/lib/db";
import { reviewSchema } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const { id } = await context.params;
    const item = await updateReview(Number(id), reviewSchema.parse(await request.json()));
    if (!item) return NextResponse.json({ error: "المراجعة غير موجودة." }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "بيانات المراجعة غير صالحة." }, { status: 400 });
    console.error("Update review error", error);
    return NextResponse.json({ error: "تعذر تحديث المراجعة." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const { id } = await context.params;
    await deleteReview(Number(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete review error", error);
    return NextResponse.json({ error: "تعذر حذف المراجعة." }, { status: 500 });
  }
}
