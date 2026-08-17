import { createHash } from "node:crypto";

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

type RateBucket = {
  count: number;
  resetAt: number;
};

type SecurityGlobals = typeof globalThis & {
  __dentalRateBuckets?: Map<string, RateBucket>;
  __dentalUploadLocks?: Map<string, number>;
};

const securityGlobals = globalThis as SecurityGlobals;
const rateBuckets = securityGlobals.__dentalRateBuckets ??= new Map<string, RateBucket>();
const uploadLocks = securityGlobals.__dentalUploadLocks ??= new Map<string, number>();

function normalizeIdentity(value: string) {
  return value.replace(/[^a-zA-Z0-9:._-]/g, "_").slice(0, 160) || "unknown";
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const vercelIp = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  return normalizeIdentity(vercelIp || forwarded || realIp || "unknown");
}

export function getSessionFingerprint(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)(?:__Host-dental_admin_session|dental_admin_session)=([^;]+)/);
  if (!match?.[1]) return getClientIp(request);
  return createHash("sha256").update(match[1]).digest("hex").slice(0, 24);
}

export function consumeRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
  identity = getClientIp(request),
): RateLimitResult {
  const now = Date.now();
  const key = `${scope}:${normalizeIdentity(identity)}`;
  const current = rateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function rateLimitResponse(result: RateLimitResult, message = "تم تجاوز عدد المحاولات المسموح بها. حاول مرة أخرى لاحقًا.") {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Retry-After": String(result.retryAfterSeconds),
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function isSafeOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return origin !== "null";
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function requestBodyTooLarge(request: Request, maxBytes: number) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  return Number.isFinite(contentLength) && contentLength > maxBytes;
}

export function getIdempotencyKey(request: Request) {
  const value = request.headers.get("x-idempotency-key")?.trim() || "";
  if (!value || value.length > 120 || !/^[a-zA-Z0-9._:-]+$/.test(value)) return null;
  return value;
}

export function createRequestToken(scope: string, identity: string, payload: unknown) {
  return createHash("sha256").update(`${scope}:${identity}:${JSON.stringify(payload)}`).digest("hex");
}

export function acquireUploadSlot(identity: string, maxConcurrent = 2) {
  const key = normalizeIdentity(identity);
  const active = uploadLocks.get(key) || 0;
  if (active >= maxConcurrent) return null;
  uploadLocks.set(key, active + 1);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const next = (uploadLocks.get(key) || 1) - 1;
    if (next <= 0) uploadLocks.delete(key);
    else uploadLocks.set(key, next);
  };
}

export function adminMutationGuard(request: Request, scope: string, options?: { limit?: number; windowMs?: number; maxBodyBytes?: number }) {
  if (!isSafeOrigin(request)) return securityError("مصدر الطلب غير مسموح.", 403);
  if (requestBodyTooLarge(request, options?.maxBodyBytes ?? 256 * 1024)) return securityError("حجم الطلب أكبر من المسموح.", 413);
  const limit = consumeRateLimit(request, `admin:${scope}`, options?.limit ?? 60, options?.windowMs ?? 60 * 1000, getSessionFingerprint(request));
  if (!limit.allowed) return rateLimitResponse(limit, "تم تجاوز عدد العمليات المسموح بها. حاول مرة أخرى لاحقًا.");
  return null;
}

export function applyApiSecurityHeaders(response: Response) {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export function securityError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
