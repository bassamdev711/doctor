import { NextResponse } from "next/server";
import { createAdminSession, hasAdminCredentials, verifyAdminCredentials } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ error: "بيانات دخول لوحة التحكم غير مضافة في Vercel بعد." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!verifyAdminCredentials(email, password)) {
      return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." }, { status: 401 });
    }

    await createAdminSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin login error", error);
    return NextResponse.json({ error: "تعذر تسجيل الدخول الآن." }, { status: 500 });
  }
}
