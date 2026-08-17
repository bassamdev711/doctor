import { Pool, type PoolClient, type QueryResultRow } from "pg";

let pool: Pool | null = null;
let schemaPromise: Promise<void> | null = null;

function getConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const host = process.env.PGHOST;
  const user = process.env.PGUSER || process.env.POSTGRES_USER;
  const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
  const database = process.env.PGDATABASE || "neondb";
  const port = process.env.PGPORT || "5432";

  if (!host || !user || !password) {
    throw new Error("Database environment variables are not configured");
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export function getPool() {
  if (!pool) {
    const connectionString = getConnectionString();
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      ssl: process.env.NODE_ENV === "production" || connectionString.includes("neon.tech")
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  return getPool().query<T>(text, values);
}

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function ensureDatabase() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS services (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          english TEXT NOT NULL DEFAULT '',
          description TEXT NOT NULL DEFAULT '',
          image_url TEXT NOT NULL DEFAULT '/hero-porcelain.jpg',
          sort_order INTEGER NOT NULL DEFAULT 0,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS offers (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          discount_percent INTEGER NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
          valid_until DATE,
          image_url TEXT NOT NULL DEFAULT '/clinic-interior.jpg',
          sort_order INTEGER NOT NULL DEFAULT 0,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS media_items (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          label TEXT NOT NULL DEFAULT 'CLINIC',
          image_url TEXT NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 0,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS reviews (
          id SERIAL PRIMARY KEY,
          author_name TEXT NOT NULL,
          content TEXT NOT NULL,
          service_name TEXT NOT NULL DEFAULT '',
          rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
          sort_order INTEGER NOT NULL DEFAULT 0,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          status TEXT NOT NULL DEFAULT 'approved',
          source TEXT NOT NULL DEFAULT 'admin',
          consent_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS bookings (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT,
          service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
          service_name TEXT NOT NULL DEFAULT '',
          preferred_date DATE NOT NULL,
          status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'completed', 'cancelled')),
          notes TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
        CREATE INDEX IF NOT EXISTS bookings_preferred_date_idx ON bookings(preferred_date);
        CREATE INDEX IF NOT EXISTS services_active_order_idx ON services(active, sort_order);
        CREATE INDEX IF NOT EXISTS media_active_order_idx ON media_items(active, sort_order);
        ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';
        ALTER TABLE reviews ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'admin';
        ALTER TABLE reviews ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;
        ALTER TABLE reviews ADD COLUMN IF NOT EXISTS service_id INTEGER REFERENCES services(id) ON DELETE SET NULL;
        UPDATE reviews SET service_id = services.id FROM services WHERE reviews.service_id IS NULL AND reviews.service_name = services.title;

        CREATE INDEX IF NOT EXISTS reviews_active_order_idx ON reviews(active, sort_order);
        CREATE INDEX IF NOT EXISTS reviews_service_idx ON reviews(service_id);
        CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews(status, created_at DESC);
        CREATE TABLE IF NOT EXISTS request_deduplication (
          scope TEXT NOT NULL,
          token TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (scope, token)
        );
        CREATE INDEX IF NOT EXISTS request_deduplication_created_idx ON request_deduplication(created_at);
      `);

      const servicesCount = await query<{ count: string }>("SELECT COUNT(*)::text AS count FROM services");
      if (servicesCount.rows[0]?.count === "0") {
        await query(
          `INSERT INTO services (title, english, description, image_url, sort_order) VALUES
            ($1, $2, $3, $4, 1),
            ($5, $6, $7, $8, 2),
            ($9, $10, $11, $12, 3),
            ($13, $14, $15, $16, 4)`,
          [
            "ابتسامة هوليود", "Smile design", "تصميم ابتسامة شخصية يوازن بين ملامح الوجه، النسب، والنتيجة الطبيعية.", "/hero-porcelain.jpg",
            "زراعة الأسنان", "Implantology", "حلول دقيقة لاستعادة الوظيفة والثقة بخطة علاج هادئة وواضحة.", "/treatment-detail.jpg",
            "التقويم الشفاف", "Clear aligners", "حركة محسوبة وابتسامة أكثر تناغمًا دون التنازل عن إيقاع حياتك.", "/clinic-interior.jpg",
            "العناية الوقائية", "Preventive care", "فحوصات وتنظيف وعادات بسيطة تحافظ على صحة ابتسامتك على المدى الطويل.", "/doctor-portrait.jpg",
          ],
        );
      }

      const mediaCount = await query<{ count: string }>("SELECT COUNT(*)::text AS count FROM media_items");
      if (mediaCount.rows[0]?.count === "0") {
        await query(
          `INSERT INTO media_items (title, label, image_url, sort_order) VALUES
            ($1, $2, $3, 1), ($4, $5, $6, 2), ($7, $8, $9, 3)`,
          [
            "مساحة تستقبلك بهدوء", "RECEPTION", "/clinic-interior.jpg",
            "تقنية لا تطغى على التجربة", "DETAILS", "/treatment-detail.jpg",
            "الجمال في التفاصيل", "ATMOSPHERE", "/hero-porcelain.jpg",
          ],
        );
      }
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  return schemaPromise;
}

export type ServiceRow = {
  id: number;
  title: string;
  english: string;
  description: string;
  image_url: string;
  sort_order: number;
  active: boolean;
};

export type OfferRow = {
  id: number;
  title: string;
  description: string;
  discount_percent: number;
  valid_until: string | null;
  image_url: string;
  sort_order: number;
  active: boolean;
};

export type MediaRow = {
  id: number;
  title: string;
  label: string;
  image_url: string;
  sort_order: number;
  active: boolean;
};

export type ReviewStatus = "pending" | "approved" | "rejected";

export type ReviewRow = {
  id: number;
  author_name: string;
  content: string;
  service_name: string;
  service_id: number | null;
  rating: number;
  sort_order: number;
  active: boolean;
  status: ReviewStatus;
  source: "public" | "admin";
  consent_at: string | null;
  created_at: string;
};

export type BookingRow = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  service_id: number | null;
  service_name: string;
  preferred_date: string;
  status: "new" | "confirmed" | "completed" | "cancelled";
  notes: string;
  created_at: string;
  updated_at: string;
};

export async function getPublicContent() {
  await ensureDatabase();
  const [services, offers, media, reviews] = await Promise.all([
    query<ServiceRow>("SELECT id, title, english, description, image_url, sort_order, active FROM services WHERE active = TRUE ORDER BY sort_order, id"),
    query<OfferRow>("SELECT id, title, description, discount_percent, valid_until, image_url, sort_order, active FROM offers WHERE active = TRUE AND (valid_until IS NULL OR valid_until >= CURRENT_DATE) ORDER BY sort_order, id"),
    query<MediaRow>("SELECT id, title, label, image_url, sort_order, active FROM media_items WHERE active = TRUE ORDER BY sort_order, id"),
    query<ReviewRow>("SELECT id, author_name, content, service_name, service_id, rating, sort_order, active, status, source, consent_at::text, created_at::text FROM reviews WHERE active = TRUE AND status = 'approved' ORDER BY sort_order, id"),
  ]);
  return { services: services.rows, offers: offers.rows, media: media.rows, reviews: reviews.rows };
}

export async function getAdminDashboard() {
  await ensureDatabase();
  const [bookings, services, offers, media, reviews, stats] = await Promise.all([
    query<BookingRow>("SELECT id, name, phone, email, service_id, service_name, preferred_date::text, status, notes, created_at::text, updated_at::text FROM bookings ORDER BY created_at DESC LIMIT 100"),
    query<ServiceRow>("SELECT id, title, english, description, image_url, sort_order, active FROM services ORDER BY sort_order, id"),
    query<OfferRow>("SELECT id, title, description, discount_percent, valid_until::text, image_url, sort_order, active FROM offers ORDER BY sort_order, id"),
    query<MediaRow>("SELECT id, title, label, image_url, sort_order, active FROM media_items ORDER BY sort_order, id"),
    query<ReviewRow>("SELECT id, author_name, content, service_name, service_id, rating, sort_order, active, status, source, consent_at::text, created_at::text FROM reviews ORDER BY CASE WHEN status = 'pending' THEN 0 WHEN status = 'approved' THEN 1 ELSE 2 END, sort_order, id"),
    query<{ total: string; new_count: string; confirmed_count: string; today_count: string; pending_reviews_count: string }>(
      `SELECT COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE status = 'new')::text AS new_count,
        COUNT(*) FILTER (WHERE status = 'confirmed')::text AS confirmed_count,
        COUNT(*) FILTER (WHERE preferred_date = CURRENT_DATE AND status <> 'cancelled')::text AS today_count,
        (SELECT COUNT(*)::text FROM reviews WHERE status = 'pending') AS pending_reviews_count
       FROM bookings`,
    ),
  ]);
  return {
    bookings: bookings.rows,
    services: services.rows,
    offers: offers.rows,
    media: media.rows,
    reviews: reviews.rows,
    stats: stats.rows[0] ?? { total: "0", new_count: "0", confirmed_count: "0", today_count: "0", pending_reviews_count: "0" },
  };
}

type ServiceInput = Pick<ServiceRow, "title" | "english" | "description" | "image_url" | "sort_order" | "active">;
type OfferInput = Pick<OfferRow, "title" | "description" | "discount_percent" | "valid_until" | "image_url" | "sort_order" | "active">;
type MediaInput = Pick<MediaRow, "title" | "label" | "image_url" | "sort_order" | "active">;
type ReviewInput = Pick<ReviewRow, "author_name" | "content" | "rating" | "sort_order" | "active"> & { service_id: number };

export async function createService(input: ServiceInput) {
  await ensureDatabase();
  const result = await query<ServiceRow>(
    `INSERT INTO services (title, english, description, image_url, sort_order, active) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, english, description, image_url, sort_order, active`,
    [input.title, input.english, input.description, input.image_url, input.sort_order, input.active],
  );
  return result.rows[0];
}

export async function updateService(id: number, input: ServiceInput) {
  await ensureDatabase();
  const result = await query<ServiceRow>(
    `UPDATE services SET title = $1, english = $2, description = $3, image_url = $4, sort_order = $5, active = $6, updated_at = NOW()
     WHERE id = $7 RETURNING id, title, english, description, image_url, sort_order, active`,
    [input.title, input.english, input.description, input.image_url, input.sort_order, input.active, id],
  );
  return result.rows[0] ?? null;
}

export async function deleteService(id: number) {
  await ensureDatabase();
  await query("DELETE FROM services WHERE id = $1", [id]);
}

export async function createOffer(input: OfferInput) {
  await ensureDatabase();
  const result = await query<OfferRow>(
    `INSERT INTO offers (title, description, discount_percent, valid_until, image_url, sort_order, active) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, title, description, discount_percent, valid_until::text, image_url, sort_order, active`,
    [input.title, input.description, input.discount_percent, input.valid_until || null, input.image_url, input.sort_order, input.active],
  );
  return result.rows[0];
}

export async function updateOffer(id: number, input: OfferInput) {
  await ensureDatabase();
  const result = await query<OfferRow>(
    `UPDATE offers SET title = $1, description = $2, discount_percent = $3, valid_until = $4, image_url = $5, sort_order = $6, active = $7, updated_at = NOW()
     WHERE id = $8 RETURNING id, title, description, discount_percent, valid_until::text, image_url, sort_order, active`,
    [input.title, input.description, input.discount_percent, input.valid_until || null, input.image_url, input.sort_order, input.active, id],
  );
  return result.rows[0] ?? null;
}

export async function deleteOffer(id: number) {
  await ensureDatabase();
  await query("DELETE FROM offers WHERE id = $1", [id]);
}

export async function createMedia(input: MediaInput) {
  await ensureDatabase();
  const result = await query<MediaRow>(
    `INSERT INTO media_items (title, label, image_url, sort_order, active) VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, label, image_url, sort_order, active`,
    [input.title, input.label, input.image_url, input.sort_order, input.active],
  );
  return result.rows[0];
}

export async function updateMedia(id: number, input: MediaInput) {
  await ensureDatabase();
  const result = await query<MediaRow>(
    `UPDATE media_items SET title = $1, label = $2, image_url = $3, sort_order = $4, active = $5, updated_at = NOW()
     WHERE id = $6 RETURNING id, title, label, image_url, sort_order, active`,
    [input.title, input.label, input.image_url, input.sort_order, input.active, id],
  );
  return result.rows[0] ?? null;
}

export async function deleteMedia(id: number) {
  await ensureDatabase();
  await query("DELETE FROM media_items WHERE id = $1", [id]);
}

export async function getReviewService(serviceId: number, activeOnly = false) {
  await ensureDatabase();
  const result = await query<{ id: number; title: string; active: boolean }>(
    `SELECT id, title, active FROM services WHERE id = $1 ${activeOnly ? "AND active = TRUE" : ""} LIMIT 1`,
    [serviceId],
  );
  return result.rows[0] ?? null;
}

export async function createReview(input: ReviewInput) {
  const service = await getReviewService(input.service_id);
  if (!service) throw new Error("REVIEW_SERVICE_NOT_FOUND");
  const result = await query<ReviewRow>(
    `INSERT INTO reviews (author_name, content, service_id, service_name, rating, sort_order, active, status, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', 'admin')
     RETURNING id, author_name, content, service_id, service_name, rating, sort_order, active, status, source, consent_at::text, created_at::text`,
    [input.author_name, input.content, service.id, service.title, input.rating, input.sort_order, input.active],
  );
  return result.rows[0];
}

export async function createPendingReview(input: { author_name: string; content: string; service_id: number; rating: number }) {
  const service = await getReviewService(input.service_id, true);
  if (!service) throw new Error("REVIEW_SERVICE_NOT_FOUND");
  const result = await query<Pick<ReviewRow, "id" | "status">>(
    `INSERT INTO reviews (author_name, content, service_id, service_name, rating, sort_order, active, status, source, consent_at)
     VALUES ($1, $2, $3, $4, $5, 0, FALSE, 'pending', 'public', NOW())
     RETURNING id, status`,
    [input.author_name, input.content, service.id, service.title, input.rating],
  );
  return result.rows[0];
}

export async function updateReview(id: number, input: ReviewInput) {
  const service = await getReviewService(input.service_id);
  if (!service) throw new Error("REVIEW_SERVICE_NOT_FOUND");
  const result = await query<ReviewRow>(
    `UPDATE reviews SET author_name = $1, content = $2, service_id = $3, service_name = $4, rating = $5, sort_order = $6, active = $7, updated_at = NOW()
     WHERE id = $8 RETURNING id, author_name, content, service_id, service_name, rating, sort_order, active, status, source, consent_at::text, created_at::text`,
    [input.author_name, input.content, service.id, service.title, input.rating, input.sort_order, input.active, id],
  );
  return result.rows[0] ?? null;
}

export async function moderateReview(id: number, status: ReviewStatus, active: boolean) {
  await ensureDatabase();
  const result = await query<ReviewRow>(
    `UPDATE reviews SET status = $1, active = $2, updated_at = NOW()
     WHERE id = $3 RETURNING id, author_name, content, service_id, service_name, rating, sort_order, active, status, source, consent_at::text, created_at::text`,
    [status, active, id],
  );
  return result.rows[0] ?? null;
}

export async function deleteReview(id: number) {
  await ensureDatabase();
  await query("DELETE FROM reviews WHERE id = $1", [id]);
}

export async function claimRequestToken(scope: string, token: string, ttlMinutes = 30) {
  await ensureDatabase();
  await query("DELETE FROM request_deduplication WHERE created_at < NOW() - ($1 * INTERVAL '1 minute')", [ttlMinutes]);
  const result = await query<{ token: string }>(
    "INSERT INTO request_deduplication (scope, token) VALUES ($1, $2) ON CONFLICT (scope, token) DO NOTHING RETURNING token",
    [scope, token],
  );
  return result.rowCount === 1;
}

export async function createBooking(input: { name: string; phone: string; email?: string; service: string; preferredDate: string; notes?: string }) {
  await ensureDatabase();
  const serviceResult = await query<{ id: number; title: string }>("SELECT id, title FROM services WHERE title = $1 LIMIT 1", [input.service]);
  const service = serviceResult.rows[0];
  const result = await query<BookingRow>(
    `INSERT INTO bookings (name, phone, email, service_id, service_name, preferred_date, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, phone, email, service_id, service_name, preferred_date::text, status, notes, created_at::text, updated_at::text`,
    [input.name, input.phone, input.email || null, service?.id ?? null, service?.title ?? input.service, input.preferredDate, input.notes || ""],
  );
  return result.rows[0];
}

export async function updateBookingStatus(id: number, status: BookingRow["status"], notes?: string) {
  await ensureDatabase();
  const result = await query<BookingRow>(
    `UPDATE bookings SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
     WHERE id = $3 RETURNING id, name, phone, email, service_id, service_name, preferred_date::text, status, notes, created_at::text, updated_at::text`,
    [status, notes ?? null, id],
  );
  return result.rows[0] ?? null;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL || (process.env.PGHOST && (process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD) && (process.env.PGUSER || process.env.POSTGRES_USER)));
}
