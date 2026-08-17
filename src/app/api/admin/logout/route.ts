import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/admin-auth";
import { adminMutationGuard } from "@/lib/request-security";

export async function POST(request: Request) {
  const guard = adminMutationGuard(request, "logout", { limit: 20, windowMs: 60 * 1000, maxBodyBytes: 8 * 1024 });
  if (guard) return guard;
  await clearAdminSession();
  return NextResponse.json({ ok: true, headers: { "Cache-Control": "no-store" } });
}
