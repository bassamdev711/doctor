import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteService, updateService } from "@/lib/db";
import { serviceSchema } from "@/lib/validation";
import { adminMutationGuard } from "@/lib/request-security";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = adminMutationGuard(request, "services-write");
  if (guard) return guard;
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const { id } = await context.params;
    const item = await updateService(Number(id), serviceSchema.parse(await request.json()));
    if (!item) return NextResponse.json({ error: "الخدمة غير موجودة." }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "بيانات الخدمة غير صالحة." }, { status: 400 });
    console.error("Update service error", error);
    return NextResponse.json({ error: "تعذر تحديث الخدمة." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = adminMutationGuard(request, "services-write", { maxBodyBytes: 8 * 1024 });
  if (guard) return guard;
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const { id } = await context.params;
    await deleteService(Number(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete service error", error);
    return NextResponse.json({ error: "تعذر حذف الخدمة." }, { status: 500 });
  }
}
