import { NextResponse } from "next/server";
import { getPublicContent, isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "قاعدة البيانات غير مهيأة بعد." }, { status: 503 });
  }

  try {
    return NextResponse.json(await getPublicContent());
  } catch (error) {
    console.error("Public content error", error);
    return NextResponse.json({ error: "تعذر تحميل محتوى العيادة." }, { status: 500 });
  }
}
