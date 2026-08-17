import { z } from "zod";

const safeUrl = z.string().trim().min(1).max(1000).refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), "رابط الصورة يجب أن يبدأ بـ / أو https://");

export const bookingSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30).regex(/^[+\d\s().-]+$/),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  service: z.string().trim().min(2).max(120),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().trim().max(1000).optional(),
});

export const serviceSchema = z.object({
  title: z.string().trim().min(2).max(120),
  english: z.string().trim().max(120),
  description: z.string().trim().min(10).max(600),
  image_url: safeUrl,
  sort_order: z.coerce.number().int().min(0).max(999),
  active: z.coerce.boolean(),
});

export const offerSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(600),
  discount_percent: z.coerce.number().int().min(0).max(100),
  valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().or(z.literal("")),
  image_url: safeUrl,
  sort_order: z.coerce.number().int().min(0).max(999),
  active: z.coerce.boolean(),
});

export const mediaSchema = z.object({
  title: z.string().trim().min(2).max(120),
  label: z.string().trim().min(2).max(80),
  image_url: safeUrl,
  sort_order: z.coerce.number().int().min(0).max(999),
  active: z.coerce.boolean(),
});

export const bookingStatusSchema = z.object({
  status: z.enum(["new", "confirmed", "completed", "cancelled"]),
  notes: z.string().trim().max(1000).optional(),
});
