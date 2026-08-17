import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { imageUploadLimits, uploadImage } from "@/lib/blob";
import { acquireUploadSlot, adminMutationGuard, getClientIp, securityError } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const guard = adminMutationGuard(request, "uploads", {
    limit: 12,
    windowMs: 10 * 60 * 1000,
    maxBodyBytes: imageUploadLimits.maxBytes + 256 * 1024,
  });
  if (guard) return guard;
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }

  const releaseUpload = acquireUploadSlot(getClientIp(request), 2);
  if (!releaseUpload) return securityError("يوجد رفعان جاريان بالفعل. انتظر حتى يكتمل أحدهما.", 429);

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
  } finally {
    releaseUpload();
  }
}
