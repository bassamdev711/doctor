import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteReview, moderateReview, updateReview } from "@/lib/db";
import { reviewModerationSchema, reviewSchema } from "@/lib/validation";
import { adminMutationGuard } from "@/lib/request-security";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = adminMutationGuard(request, "reviews-moderate");
  if (guard) return guard;
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "معرّف المراجعة غير صالح." }, { status: 400 });

    const payload = await request.json() as Record<string, unknown>;
    if ("status" in payload) {
      const moderation = reviewModerationSchema.safeParse(payload);
      if (!moderation.success) return NextResponse.json({ error: "حالة المراجعة غير صالحة." }, { status: 400 });
      const item = await moderateReview(id, moderation.data.status, moderation.data.status === "approved");
      if (!item) return NextResponse.json({ error: "المراجعة غير موجودة." }, { status: 404 });
      return NextResponse.json({ item });
    }

    const parsed = reviewSchema.safeParse(payload);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "بيانات المراجعة غير صالحة." }, { status: 400 });
    const item = await updateReview(id, parsed.data);
    if (!item) return NextResponse.json({ error: "المراجعة غير موجودة." }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    console.error("Update review error", error);
    return NextResponse.json({ error: "تعذر تحديث المراجعة." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = adminMutationGuard(request, "reviews-moderate", { maxBodyBytes: 8 * 1024 });
  if (guard) return guard;
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "معرّف المراجعة غير صالح." }, { status: 400 });
    await deleteReview(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete review error", error);
    return NextResponse.json({ error: "تعذر حذف المراجعة." }, { status: 500 });
  }
}
