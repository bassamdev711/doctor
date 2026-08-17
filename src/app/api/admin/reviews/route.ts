import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createReview } from "@/lib/db";
import { reviewSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const review = reviewSchema.parse(await request.json());
    return NextResponse.json({ item: await createReview(review) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "بيانات المراجعة غير صالحة." }, { status: 400 });
    console.error("Create review error", error);
    return NextResponse.json({ error: "تعذر حفظ المراجعة." }, { status: 500 });
  }
}
