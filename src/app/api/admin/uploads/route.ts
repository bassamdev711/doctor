import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { imageUploadLimits, uploadImage } from "@/lib/blob";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") || "gallery");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "اختر ملف صورة أولًا." }, { status: 400 });
    }

    const blob = await uploadImage(file, folder);
    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
      size: file.size,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNSUPPORTED_IMAGE_TYPE") {
      return NextResponse.json({ error: "الصيغ المسموحة: JPG وPNG وWEBP وAVIF." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "IMAGE_TOO_LARGE") {
      return NextResponse.json({ error: "حجم الصورة يجب ألا يتجاوز 4.5 ميجابايت." }, { status: 400 });
    }
    console.error("Blob upload error", error);
    return NextResponse.json({
      error: "تعذر رفع الصورة. تأكد من ربط Blob بالمشروع وإضافة BLOB_READ_WRITE_TOKEN أو بيانات OIDC.",
      limits: imageUploadLimits,
    }, { status: 503 });
  }
}
