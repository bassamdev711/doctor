import { del, put } from "@vercel/blob";

const MAX_IMAGE_BYTES = 4.5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function isManagedBlobUrl(url: string) {
  return url.includes(".blob.vercel-storage.com/");
}

export async function removeManagedBlob(url: string) {
  if (!isManagedBlobUrl(url)) return;
  try {
    await del(url);
  } catch (error) {
    console.warn("Unable to remove Vercel Blob asset", error);
  }
}

export async function uploadImage(file: File, folder: string) {
  if (!IMAGE_TYPES.has(file.type)) {
    throw new Error("UNSUPPORTED_IMAGE_TYPE");
  }
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  const cleanFolder = folder.replace(/[^a-z0-9/_-]/gi, "").replace(/^\/+|\/+$/g, "") || "gallery";
  const cleanName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-").slice(-96) || "image";
  const blob = await put(`dental/${cleanFolder}/${Date.now()}-${cleanName}`, file, {
    access: "public",
    addRandomSuffix: true,
    cacheControlMaxAge: 31536000,
  });
  return blob;
}

export const imageUploadLimits = {
  maxBytes: MAX_IMAGE_BYTES,
  acceptedTypes: Array.from(IMAGE_TYPES),
};
