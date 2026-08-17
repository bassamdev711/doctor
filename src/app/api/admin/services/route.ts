import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createService } from "@/lib/db";
import { serviceSchema } from "@/lib/validation";
import { adminMutationGuard } from "@/lib/request-security";

export async function POST(request: Request) {
  const guard = adminMutationGuard(request, "services-write");
  if (guard) return guard;
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const service = serviceSchema.parse(await request.json());
    return NextResponse.json({ item: await createService(service) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "بيانات الخدمة غير صالحة." }, { status: 400 });
    console.error("Create service error", error);
    return NextResponse.json({ error: "تعذر حفظ الخدمة." }, { status: 500 });
  }
}
