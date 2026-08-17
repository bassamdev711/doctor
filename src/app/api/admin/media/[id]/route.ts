import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteMedia, updateMedia } from "@/lib/db";
import { mediaSchema } from "@/lib/validation";
import { adminMutationGuard } from "@/lib/request-security";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = adminMutationGuard(request, "media-write");
  if (guard) return guard;
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const { id } = await context.params;
    const item = await updateMedia(Number(id), mediaSchema.parse(await request.json()));
    if (!item) return NextResponse.json({ error: "الصورة غير موجودة." }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "بيانات الصورة غير صالحة." }, { status: 400 });
    console.error("Update media error", error);
    return NextResponse.json({ error: "تعذر تحديث الصورة." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = adminMutationGuard(request, "media-write", { maxBodyBytes: 8 * 1024 });
  if (guard) return guard;
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const { id } = await context.params;
    await deleteMedia(Number(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete media error", error);
    return NextResponse.json({ error: "تعذر حذف الصورة." }, { status: 500 });
  }
}
