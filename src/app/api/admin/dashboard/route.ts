import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminDashboard, isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "قاعدة البيانات غير مهيأة." }, { status: 503 });
  }

  try {
    return NextResponse.json(await getAdminDashboard());
  } catch (error) {
    console.error("Admin dashboard error", error);
    return NextResponse.json({ error: "تعذر تحميل لوحة التحكم." }, { status: 500 });
  }
}
