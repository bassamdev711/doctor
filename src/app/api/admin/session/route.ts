import { NextResponse } from "next/server";
import { hasAdminCredentials, isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET() {
  return NextResponse.json({ configured: hasAdminCredentials(), authenticated: await isAdminAuthenticated() });
}
