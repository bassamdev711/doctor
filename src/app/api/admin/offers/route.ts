import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createOffer } from "@/lib/db";
import { offerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  try {
    const offer = offerSchema.parse(await request.json());
    return NextResponse.json({ item: await createOffer(offer) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "بيانات العرض غير صالحة." }, { status: 400 });
    console.error("Create offer error", error);
    return NextResponse.json({ error: "تعذر حفظ العرض." }, { status: 500 });
  }
}
