import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteOffer, updateOffer } from "@/lib/db";
import { offerSchema } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const { id } = await context.params;
    const item = await updateOffer(Number(id), offerSchema.parse(await request.json()));
    if (!item) return NextResponse.json({ error: "العرض غير موجود." }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "بيانات العرض غير صالحة." }, { status: 400 });
    console.error("Update offer error", error);
    return NextResponse.json({ error: "تعذر تحديث العرض." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const { id } = await context.params;
    await deleteOffer(Number(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete offer error", error);
    return NextResponse.json({ error: "تعذر حذف العرض." }, { status: 500 });
  }
}
