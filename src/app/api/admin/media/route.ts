import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createMedia } from "@/lib/db";
import { mediaSchema } from "@/lib/validation";
import { adminMutationGuard } from "@/lib/request-security";

export async function POST(request: Request) {
  const guard = adminMutationGuard(request, "media-write");
  if (guard) return guard;
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const media = mediaSchema.parse(await request.json());
    return NextResponse.json({ item: await createMedia(media) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "بيانات الصورة غير صالحة." }, { status: 400 });
    console.error("Create media error", error);
    return NextResponse.json({ error: "تعذر حفظ الصورة." }, { status: 500 });
  }
}
