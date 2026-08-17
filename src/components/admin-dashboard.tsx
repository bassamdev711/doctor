"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

 type Booking = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  service_name: string;
  preferred_date: string;
  status: "new" | "confirmed" | "completed" | "cancelled";
  notes: string;
  created_at: string;
};

type Service = { id: number; title: string; english: string; description: string; image_url: string; sort_order: number; active: boolean };
type Offer = { id: number; title: string; description: string; discount_percent: number; valid_until: string | null; image_url: string; sort_order: number; active: boolean };
type MediaItem = { id: number; title: string; label: string; image_url: string; sort_order: number; active: boolean };
type Review = { id: number; author_name: string; content: string; service_id: number | null; service_name: string; rating: number; sort_order: number; active: boolean; status: "pending" | "approved" | "rejected"; source: "public" | "admin"; consent_at: string | null; created_at: string };
type DashboardData = { bookings: Booking[]; services: Service[]; offers: Offer[]; media: MediaItem[]; reviews: Review[]; stats: { total: string; new_count: string; confirmed_count: string; today_count: string; pending_reviews_count: string } };
type Tab = "overview" | "bookings" | "services" | "offers" | "media" | "reviews";
type IconName = "tooth" | "overview" | "bookings" | "services" | "offers" | "media" | "reviews" | "empty";

function AdminIcon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.35, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: "admin-icon", "aria-hidden": true };
  if (name === "tooth") return <svg {...common}><path d="M5.3 3.3c-1.8 0-2.8 1.8-2.8 4.2 0 2.2 1 3.1 1.5 5.2.5 2.1 1 3.5 2 3.5 1 0 1.2-1.8 1.5-3.5.3-1.4.8-1.4 1.1 0 0.3 1.7.5 3.5 1.5 3.5s1.5-1.4 2-3.5c.5-2.1 1.5-3 1.5-5.2 0-2.4-1-4.2-2.8-4.2-1 0-1.7.5-2.5 1.1-.8-.6-1.5-1.1-2.5-1.1Z" /></svg>;
  if (name === "overview") return <svg {...common}><path d="m3 9 7-6 7 6" /><path d="M5 8.5V17h10V8.5" /><path d="M8 17v-4h4v4" /></svg>;
  if (name === "bookings") return <svg {...common}><rect x="3" y="4.5" width="14" height="12" rx="1.5" /><path d="M6.5 2.5v4M13.5 2.5v4M3 8.5h14M6.5 11.5h.01M10 11.5h.01M13.5 11.5h.01M6.5 14.5h.01M10 14.5h.01" /></svg>;
  if (name === "services") return <svg {...common}><path d="M3.5 5h13M3.5 9.5h13M3.5 14h8" /><circle cx="15" cy="14" r="2" /></svg>;
  if (name === "offers") return <svg {...common}><path d="m3.5 5.5 5-2 8 8-5 5-8-8v-3Z" /><circle cx="7" cy="7" r=".8" /></svg>;
  if (name === "media") return <svg {...common}><rect x="3" y="4" width="14" height="12" rx="1.5" /><circle cx="7" cy="8" r="1" /><path d="m4.5 14 3.5-3 2.5 2 2-2 3 3" /></svg>;
  if (name === "reviews") return <svg {...common}><path d="M4 4.5h12a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 16 14.5H9l-3.5 3v-3H4A1.5 1.5 0 0 1 2.5 13V6A1.5 1.5 0 0 1 4 4.5Z" /><path d="M6 8h8M6 11h5" /></svg>;
  return <svg {...common}><path d="M5 2.8h6l4 4V17H5z" /><path d="M11 2.8v4h4M7.5 10h5M7.5 13h5" /></svg>;
}

const emptyService = { title: "", english: "", description: "", image_url: "/hero-porcelain.jpg", sort_order: 1, active: true };
const emptyOffer = { title: "", description: "", discount_percent: 10, valid_until: "", image_url: "/clinic-interior.jpg", sort_order: 1, active: true };
const emptyMedia = { title: "", label: "CLINIC", image_url: "", sort_order: 1, active: true };
const emptyReview = { author_name: "", content: "", service_id: 0, rating: 5, sort_order: 1, active: true };

const reviewStatusLabels: Record<Review["status"], string> = { pending: "معلقة للمراجعة", approved: "معتمدة ومنشورة", rejected: "مرفوضة" };

async function requestJson<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } });
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "تعذر تنفيذ العملية.");
  return payload;
}

function formatDate(value: string) {
  try { return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(`${value}T12:00:00`)); } catch { return value; }
}

function formatDateTime(value: string) {
  try { return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); } catch { return value; }
}

function StatusPill({ status }: { status: Booking["status"] }) {
  const labels = { new: "جديد", confirmed: "مؤكد", completed: "مكتمل", cancelled: "ملغى" };
  return <span className={`status-pill status-${status}`}>{labels[status]}</span>;
}

function AdminBrand() {
  return <div className="admin-brand"><span className="admin-brand-symbol"><AdminIcon name="tooth" size={17} /></span><span><strong>د. ليان</strong><small>لوحة العيادة</small></span></div>;
}

export default function AdminDashboard() {
  const [session, setSession] = useState<{ configured: boolean; authenticated: boolean } | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await requestJson<DashboardData>("/api/admin/dashboard");
      setData(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل لوحة التحكم.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestJson<{ configured: boolean; authenticated: boolean }>("/api/admin/session", { headers: {} })
      .then((payload) => {
        setSession(payload);
        if (payload.authenticated) return loadDashboard();
        setLoading(false);
      })
      .catch((sessionError) => {
        setError(sessionError instanceof Error ? sessionError.message : "تعذر الاتصال بالخادم.");
        setLoading(false);
      });
  }, []);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const logout = async () => {
    await requestJson("/api/admin/logout", { method: "POST" });
    setSession({ configured: true, authenticated: false });
    setData(null);
  };

  if (loading && !session) return <main className="admin-loading"><div className="admin-loader" /><p>نجهّز لوحة العيادة...</p></main>;
  if (!session?.authenticated) return <LoginScreen configured={session?.configured ?? false} error={error} onSuccess={(nextSession) => { setSession(nextSession); loadDashboard(); }} />;

  const tabs: Array<{ id: Tab; label: string; icon: IconName }> = [
    { id: "overview", label: "نظرة عامة", icon: "overview" },
    { id: "bookings", label: "الحجوزات", icon: "bookings" },
    { id: "services", label: "الخدمات", icon: "services" },
    { id: "offers", label: "العروض والخصومات", icon: "offers" },
    { id: "media", label: "الصور والمعرض", icon: "media" },
    { id: "reviews", label: "آراء العملاء", icon: "reviews" },
  ];

  return <main dir="rtl" className="admin-shell">
    <aside className="admin-sidebar"><AdminBrand /><div className="admin-sidebar-label">إدارة العيادة</div><nav className="admin-nav">{tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? "is-active" : ""} onClick={() => setActiveTab(tab.id)}><span><AdminIcon name={tab.icon} size={16} /></span>{tab.label}{tab.id === "bookings" && data && Number(data.stats.new_count) > 0 && <b>{data.stats.new_count}</b>}{tab.id === "reviews" && data && Number(data.stats.pending_reviews_count) > 0 && <b>{data.stats.pending_reviews_count}</b>}</button>)}</nav><div className="admin-sidebar-bottom"><Link href="/" target="_blank" rel="noreferrer">عرض الموقع ↗</Link><button onClick={logout}>تسجيل الخروج</button></div></aside>
    <section className="admin-main"><header className="admin-topbar"><div><span className="admin-overline">إدارة عيادة د. ليان</span><h1>{tabs.find((tab) => tab.id === activeTab)?.label}</h1></div><div className="admin-top-actions"><button className="admin-refresh" onClick={loadDashboard}>تحديث البيانات ↻</button><div className="admin-avatar">د</div></div></header>{notice && <div className="admin-notice">✓ {notice}</div>}{error && <div className="admin-error">{error}</div>}
      {data && activeTab === "overview" && <Overview data={data} setActiveTab={setActiveTab} />}
      {data && activeTab === "bookings" && <Bookings data={data} reload={loadDashboard} showNotice={showNotice} />}
      {data && activeTab === "services" && <Services data={data} reload={loadDashboard} showNotice={showNotice} />}
      {data && activeTab === "offers" && <Offers data={data} reload={loadDashboard} showNotice={showNotice} />}
      {data && activeTab === "media" && <Media data={data} reload={loadDashboard} showNotice={showNotice} />}
      {data && activeTab === "reviews" && <Reviews data={data} reload={loadDashboard} showNotice={showNotice} />}
    </section>
  </main>;
}

function LoginScreen({ configured, error, onSuccess }: { configured: boolean; error: string; onSuccess: (session: { configured: boolean; authenticated: boolean }) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSubmitting(true); setLocalError("");
    try { await requestJson("/api/admin/login", { method: "POST", body: JSON.stringify({ email, password }) }); onSuccess({ configured: true, authenticated: true }); }
    catch (loginError) { setLocalError(loginError instanceof Error ? loginError.message : "تعذر تسجيل الدخول."); }
    finally { setSubmitting(false); }
  };
  return <main dir="rtl" className="admin-login"><div className="login-panel"><AdminBrand /><span className="login-eyebrow">مساحة خاصة بالدكتور</span><h1>مرحبًا بك<br /><em>في لوحتك.</em></h1>{!configured ? <div className="admin-error">أضف ADMIN_EMAIL و ADMIN_PASSWORD في Vercel أولًا، ثم أعد تحميل الصفحة.</div> : <form onSubmit={submit} className="admin-login-form"><label>البريد الإلكتروني<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="doctor@example.com" /></label><label>كلمة المرور<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" /></label>{(localError || error) && <p className="form-error">{localError || error}</p>}<button className="admin-primary-button" disabled={submitting}>{submitting ? "جارٍ التحقق..." : "دخول آمن ←"}</button></form>}<Link className="login-back" href="/">العودة إلى الموقع</Link></div><div className="login-art"><div className="login-orbit" /><span>PRECISION<br />IN CARE</span></div></main>;
}

function Overview({ data, setActiveTab }: { data: DashboardData; setActiveTab: (tab: Tab) => void }) {
  const stats = [{ label: "إجمالي الحجوزات", value: data.stats.total, meta: "منذ بدء التشغيل", tab: "bookings" as Tab }, { label: "طلبات جديدة", value: data.stats.new_count, meta: "تحتاج إلى مراجعة", tab: "bookings" as Tab }, { label: "مواعيد مؤكدة", value: data.stats.confirmed_count, meta: "في جدول العيادة", tab: "bookings" as Tab }, { label: "مواعيد اليوم", value: data.stats.today_count, meta: "غير ملغاة", tab: "bookings" as Tab }];
  const latest = data.bookings.slice(0, 5);
  return <div className="admin-content"><div className="admin-welcome"><div><span>صباح الخير، د. ليان</span><h2>كل ما يهم عيادتك<br /><em>في مكان واحد.</em></h2></div><div className="admin-welcome-mark"><AdminIcon name="overview" size={31} /></div></div><div className="admin-stat-grid">{stats.map((stat) => <button key={stat.label} className="admin-stat-card" onClick={() => setActiveTab(stat.tab)}><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.meta} ↗</small></button>)}</div><div className="admin-two-column"><section className="admin-panel-card"><div className="panel-heading"><div><span className="panel-kicker">آخر النشاطات</span><h3>أحدث الحجوزات</h3></div><button onClick={() => setActiveTab("bookings")}>عرض الكل ←</button></div>{latest.length === 0 ? <EmptyState label="لا توجد حجوزات بعد" /> : <div className="mini-bookings">{latest.map((booking) => <div className="mini-booking" key={booking.id}><div className="mini-booking-avatar">{booking.name.slice(0, 1)}</div><div><strong>{booking.name}</strong><span>{booking.service_name} · {formatDate(booking.preferred_date)}</span></div><StatusPill status={booking.status} /></div>)}</div>}</section><section className="admin-panel-card quick-actions"><div className="panel-heading"><div><span className="panel-kicker">إدارة سريعة</span><h3>محتوى العيادة</h3></div></div><button onClick={() => setActiveTab("services")}><span className="quick-action-mark"><AdminIcon name="services" size={16} /></span><div><strong>{data.services.length} خدمات</strong><small>تعديل الخدمات ووصفها وصورها</small></div><b>←</b></button><button onClick={() => setActiveTab("offers")}><span className="quick-action-mark"><AdminIcon name="offers" size={16} /></span><div><strong>{data.offers.length} عروض نشطة</strong><small>إضافة خصم أو حملة موسمية</small></div><b>←</b></button><button onClick={() => setActiveTab("media")}><span className="quick-action-mark"><AdminIcon name="media" size={16} /></span><div><strong>{data.media.length} صور في المعرض</strong><small>تحديث صور العيادة وروابطها</small></div><b>←</b></button><button onClick={() => setActiveTab("reviews")}><span className="quick-action-mark"><AdminIcon name="reviews" size={16} /></span><div><strong>{data.reviews.length} آراء عملاء</strong><small>اعرض أو أخفِ أو احذف المراجعات</small></div><b>←</b></button></section></div></div>;
}

function Bookings({ data, reload, showNotice }: { data: DashboardData; reload: () => void; showNotice: (message: string) => void }) {
  const [filter, setFilter] = useState<Booking["status"] | "all">("all");
  const filtered = useMemo(() => filter === "all" ? data.bookings : data.bookings.filter((booking) => booking.status === filter), [data.bookings, filter]);
  const updateStatus = async (booking: Booking, status: Booking["status"]) => { try { await requestJson(`/api/admin/bookings/${booking.id}`, { method: "PATCH", body: JSON.stringify({ status }) }); showNotice("تم تحديث حالة الحجز."); reload(); } catch (error) { showNotice(error instanceof Error ? error.message : "تعذر التحديث."); } };
  return <div className="admin-content"><div className="content-toolbar"><div><span className="panel-kicker">الجدول الكامل</span><p>تابع طلبات المرضى وحدث الحالة من مكان واحد.</p></div><div className="filter-pills">{[["all", "الكل"], ["new", "جديد"], ["confirmed", "مؤكد"], ["completed", "مكتمل"]].map(([value, label]) => <button key={value} className={filter === value ? "is-active" : ""} onClick={() => setFilter(value as Booking["status"] | "all")}>{label}</button>)}</div></div><section className="admin-panel-card table-card">{filtered.length === 0 ? <EmptyState label="لا توجد حجوزات في هذا التصنيف" /> : <div className="booking-table"><div className="booking-table-head"><span>المريض</span><span>الخدمة</span><span>التاريخ</span><span>تاريخ الطلب</span><span>الحالة</span></div>{filtered.map((booking) => <div className="booking-table-row" key={booking.id}><div className="patient-cell"><div className="mini-booking-avatar">{booking.name.slice(0, 1)}</div><div><strong>{booking.name}</strong><small dir="ltr">{booking.phone}</small></div></div><span>{booking.service_name}</span><span>{formatDate(booking.preferred_date)}</span><span>{formatDateTime(booking.created_at)}</span><select aria-label={`حالة ${booking.name}`} value={booking.status} onChange={(event) => updateStatus(booking, event.target.value as Booking["status"])}><option value="new">جديد</option><option value="confirmed">مؤكد</option><option value="completed">مكتمل</option><option value="cancelled">ملغى</option></select></div>)}</div>}</section></div>;
}

function Services({ data, reload, showNotice }: { data: DashboardData; reload: () => void; showNotice: (message: string) => void }) {
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(emptyService);
  const save = async (event: FormEvent) => { event.preventDefault(); if (!form.image_url) { showNotice("ارفع صورة الخدمة أولًا."); return; } try { await requestJson(editing ? `/api/admin/services/${editing}` : "/api/admin/services", { method: editing ? "PATCH" : "POST", body: JSON.stringify({ ...form, sort_order: Number(form.sort_order) }) }); showNotice(editing ? "تم تحديث الخدمة." : "تمت إضافة الخدمة."); setEditing(null); setForm(emptyService); reload(); } catch (error) { showNotice(error instanceof Error ? error.message : "تعذر الحفظ."); } };
  const edit = (service: Service) => { setEditing(service.id); setForm({ title: service.title, english: service.english, description: service.description, image_url: service.image_url, sort_order: service.sort_order, active: service.active }); };
  const remove = async (id: number) => { if (!window.confirm("هل تريد حذف هذه الخدمة؟")) return; try { await requestJson(`/api/admin/services/${id}`, { method: "DELETE" }); showNotice("تم حذف الخدمة."); reload(); } catch (error) { showNotice(error instanceof Error ? error.message : "تعذر الحذف."); } };
  return <div className="admin-content"><div className="content-toolbar"><div><span className="panel-kicker">محتوى قابل للتحكم</span><p>الخدمات التي تظهر في صفحة الموقع العامة.</p></div><button className="admin-primary-button compact" onClick={() => { setEditing(null); setForm(emptyService); }}>+ إضافة خدمة</button></div><div className="admin-editor-layout"><section className="admin-panel-card editor-list">{data.services.map((service) => <div className={`editor-row ${!service.active ? "is-muted" : ""}`} key={service.id}><img src={service.image_url} alt="" /><div><strong>{service.title}</strong><small>{service.english}</small><em>{service.active ? "نشطة على الموقع" : "مخفية عن الموقع"}</em></div><div className="row-actions"><button onClick={() => edit(service)}>تعديل</button><button className="danger-text" onClick={() => remove(service.id)}>حذف</button></div></div>)}</section><EditorForm title={editing ? "تعديل الخدمة" : "خدمة جديدة"} onSubmit={save} onCancel={() => { setEditing(null); setForm(emptyService); }}><Field label="اسم الخدمة" value={form.title} onChange={(value) => setForm({ ...form, title: value })} /><Field label="الاسم الإنجليزي" value={form.english} onChange={(value) => setForm({ ...form, english: value })} /><Field label="الوصف" value={form.description} multiline onChange={(value) => setForm({ ...form, description: value })} /><UploadField label="صورة الخدمة" folder="services" value={form.image_url} onUploaded={(url) => setForm({ ...form, image_url: url })} /><div className="form-grid"><Field label="الترتيب" value={String(form.sort_order)} type="number" onChange={(value) => setForm({ ...form, sort_order: Number(value) })} /><label className="toggle-field"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /><span>تظهر على الموقع</span></label></div></EditorForm></div></div>;
}

function Offers({ data, reload, showNotice }: { data: DashboardData; reload: () => void; showNotice: (message: string) => void }) {
  const [editing, setEditing] = useState<number | null>(null); const [form, setForm] = useState(emptyOffer);
  const save = async (event: FormEvent) => { event.preventDefault(); if (!form.image_url) { showNotice("ارفع صورة العرض أولًا."); return; } try { await requestJson(editing ? `/api/admin/offers/${editing}` : "/api/admin/offers", { method: editing ? "PATCH" : "POST", body: JSON.stringify({ ...form, discount_percent: Number(form.discount_percent), sort_order: Number(form.sort_order), valid_until: form.valid_until || "" }) }); showNotice(editing ? "تم تحديث العرض." : "تمت إضافة العرض."); setEditing(null); setForm(emptyOffer); reload(); } catch (error) { showNotice(error instanceof Error ? error.message : "تعذر الحفظ."); } };
  const remove = async (id: number) => { if (!window.confirm("هل تريد حذف هذا العرض؟")) return; try { await requestJson(`/api/admin/offers/${id}`, { method: "DELETE" }); showNotice("تم حذف العرض."); reload(); } catch (error) { showNotice(error instanceof Error ? error.message : "تعذر الحذف."); } };
  return <div className="admin-content"><div className="content-toolbar"><div><span className="panel-kicker">عروض موسمية وخصومات</span><p>أنشئ حملات تظهر تلقائيًا في الموقع حتى تاريخ انتهائها.</p></div><button className="admin-primary-button compact" onClick={() => { setEditing(null); setForm(emptyOffer); }}>+ إضافة عرض</button></div><div className="admin-editor-layout"><section className="admin-panel-card editor-list">{data.offers.length === 0 ? <EmptyState label="لا توجد عروض. أضف أول عرض الآن." /> : data.offers.map((offer) => <div className={`editor-row ${!offer.active ? "is-muted" : ""}`} key={offer.id}><img src={offer.image_url} alt="" /><div><strong>{offer.title}</strong><small>{offer.discount_percent}% خصم {offer.valid_until ? `حتى ${offer.valid_until}` : ""}</small><em>{offer.active ? "نشط على الموقع" : "مخفي عن الموقع"}</em></div><div className="row-actions"><button onClick={() => { setEditing(offer.id); setForm({ title: offer.title, description: offer.description, discount_percent: offer.discount_percent, valid_until: offer.valid_until || "", image_url: offer.image_url, sort_order: offer.sort_order, active: offer.active }); }}>تعديل</button><button className="danger-text" onClick={() => remove(offer.id)}>حذف</button></div></div>)}</section><EditorForm title={editing ? "تعديل العرض" : "عرض جديد"} onSubmit={save} onCancel={() => { setEditing(null); setForm(emptyOffer); }}><Field label="عنوان العرض" value={form.title} onChange={(value) => setForm({ ...form, title: value })} /><Field label="التفاصيل" value={form.description} multiline onChange={(value) => setForm({ ...form, description: value })} /><div className="form-grid"><Field label="نسبة الخصم" value={String(form.discount_percent)} type="number" onChange={(value) => setForm({ ...form, discount_percent: Number(value) })} /><Field label="متاح حتى" value={form.valid_until} type="date" onChange={(value) => setForm({ ...form, valid_until: value })} /></div><UploadField label="صورة العرض" folder="offers" value={form.image_url} onUploaded={(url) => setForm({ ...form, image_url: url })} /><div className="form-grid"><Field label="الترتيب" value={String(form.sort_order)} type="number" onChange={(value) => setForm({ ...form, sort_order: Number(value) })} /><label className="toggle-field"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /><span>يظهر على الموقع</span></label></div></EditorForm></div></div>;
}

function Media({ data, reload, showNotice }: { data: DashboardData; reload: () => void; showNotice: (message: string) => void }) {
  const [editing, setEditing] = useState<number | null>(null); const [form, setForm] = useState(emptyMedia);
  const save = async (event: FormEvent) => { event.preventDefault(); if (!form.image_url) { showNotice("ارفع صورة المعرض أولًا."); return; } try { await requestJson(editing ? `/api/admin/media/${editing}` : "/api/admin/media", { method: editing ? "PATCH" : "POST", body: JSON.stringify({ ...form, sort_order: Number(form.sort_order) }) }); showNotice(editing ? "تم تحديث الصورة." : "تمت إضافة الصورة."); setEditing(null); setForm(emptyMedia); reload(); } catch (error) { showNotice(error instanceof Error ? error.message : "تعذر الحفظ."); } };
  const remove = async (id: number) => { if (!window.confirm("هل تريد حذف هذه الصورة؟")) return; try { await requestJson(`/api/admin/media/${id}`, { method: "DELETE" }); showNotice("تم حذف الصورة."); reload(); } catch (error) { showNotice(error instanceof Error ? error.message : "تعذر الحذف."); } };
  return <div className="admin-content"><div className="content-toolbar"><div><span className="panel-kicker">المعرض البصري</span><p>تحكم في صور العيادة التي تظهر في الصفحة الرئيسية.</p></div><button className="admin-primary-button compact" onClick={() => { setEditing(null); setForm(emptyMedia); }}>+ إضافة صورة</button></div><div className="admin-editor-layout"><section className="admin-panel-card media-admin-grid">{data.media.map((item) => <article className={!item.active ? "is-muted" : ""} key={item.id}><img src={item.image_url} alt={item.title} /><div><span>{item.label}</span><strong>{item.title}</strong><div className="row-actions"><button onClick={() => { setEditing(item.id); setForm({ title: item.title, label: item.label, image_url: item.image_url, sort_order: item.sort_order, active: item.active }); }}>تعديل</button><button className="danger-text" onClick={() => remove(item.id)}>حذف</button></div></div></article>)}</section><EditorForm title={editing ? "تعديل الصورة" : "صورة جديدة"} onSubmit={save} onCancel={() => { setEditing(null); setForm(emptyMedia); }}><Field label="عنوان الصورة" value={form.title} onChange={(value) => setForm({ ...form, title: value })} /><Field label="التصنيف القصير" value={form.label} onChange={(value) => setForm({ ...form, label: value })} /><UploadField label="صورة المعرض" folder="gallery" value={form.image_url} onUploaded={(url) => setForm({ ...form, image_url: url })} /><div className="form-grid"><Field label="الترتيب" value={String(form.sort_order)} type="number" onChange={(value) => setForm({ ...form, sort_order: Number(value) })} /><label className="toggle-field"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /><span>تظهر على الموقع</span></label></div><p className="editor-help">اختر الصورة من جهازك. سيتم رفعها إلى Vercel Blob تلقائيًا وحفظ الرابط في قاعدة البيانات مع نسخة محسنة للتحميل السريع.</p></EditorForm></div></div>;
}

function Reviews({ data, reload, showNotice }: { data: DashboardData; reload: () => void; showNotice: (message: string) => void }) {
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(emptyReview);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await requestJson(editing ? `/api/admin/reviews/${editing}` : "/api/admin/reviews", { method: editing ? "PATCH" : "POST", body: JSON.stringify({ ...form, service_id: Number(form.service_id), rating: Number(form.rating), sort_order: Number(form.sort_order) }) });
      showNotice(editing ? "تم تحديث المراجعة." : "تمت إضافة المراجعة.");
      setEditing(null);
      setForm(emptyReview);
      reload();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "تعذر حفظ المراجعة.");
    }
  };
    const edit = (review: Review) => { setEditing(review.id); setForm({ author_name: review.author_name, content: review.content, service_id: review.service_id ?? 0, rating: review.rating, sort_order: review.sort_order, active: review.active }); };
  const moderate = async (id: number, status: Review["status"], message: string) => { try { await requestJson(`/api/admin/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); showNotice(message); reload(); } catch (error) { showNotice(error instanceof Error ? error.message : "تعذر تحديث حالة المراجعة."); } };
  const remove = async (id: number) => { if (!window.confirm("هل تريد حذف هذه المراجعة نهائيًا؟")) return; try { await requestJson(`/api/admin/reviews/${id}`, { method: "DELETE" }); showNotice("تم حذف المراجعة."); reload(); } catch (error) { showNotice(error instanceof Error ? error.message : "تعذر حذف المراجعة."); } };
  return <div className="admin-content"><div className="content-toolbar"><div><span className="panel-kicker">مراجعات العملاء من Neon</span><p>المراجعات القادمة من الموقع تبقى معلقة حتى يعتمدها الدكتور، ولا تظهر للعامة قبل ذلك.</p></div><button className="admin-primary-button compact" onClick={() => { setEditing(null); setForm(emptyReview); }}>+ إضافة مراجعة</button></div><div className="admin-editor-layout"><section className="admin-panel-card review-admin-list">{data.reviews.length === 0 ? <EmptyState label="لا توجد مراجعات بعد. أضف أول تجربة عميل." /> : data.reviews.map((review) => <article className={`review-admin-row ${review.status === "pending" ? "is-pending" : ""} ${!review.active ? "is-muted" : ""}`} key={review.id}><div className="review-admin-index"><span>{String(review.sort_order).padStart(2, "0")}</span><b>{review.rating}/5</b><small className={`review-status-label ${review.status}`}>{reviewStatusLabels[review.status]}</small></div><div className="review-admin-copy"><strong>{review.author_name}</strong><small>{review.service_name} · {review.source === "public" ? "أرسلها العميل" : "أضيفت من اللوحة"}</small><p>{review.content}</p><em>{review.active && review.status === "approved" ? "منشورة للعامة" : review.status === "pending" ? "بانتظار قرار الدكتور" : review.status === "rejected" ? "لن تظهر للعامة" : "مخفية عن الموقع"}</em></div><div className="review-status-actions"><button onClick={() => edit(review)}>تعديل</button>{review.status !== "approved" && <button className="approve-review" onClick={() => moderate(review.id, "approved", "تم اعتماد المراجعة ونشرها.")}>اعتماد ونشر</button>}{review.status === "pending" && <button className="reject-review" onClick={() => moderate(review.id, "rejected", "تم رفض المراجعة وإخفاؤها.")}>رفض</button>}{review.status === "approved" && <button onClick={() => moderate(review.id, "pending", "تم إخفاء المراجعة وإعادتها للمراجعة.")}>إخفاء</button>}{review.status === "rejected" && <button onClick={() => moderate(review.id, "pending", "تمت إعادة المراجعة إلى قائمة الانتظار.")}>إعادة للمراجعة</button>}<button className="delete-review" onClick={() => remove(review.id)}>حذف</button></div></article>)}</section><EditorForm title={editing ? "تعديل المراجعة" : "مراجعة جديدة"} onSubmit={save} onCancel={() => { setEditing(null); setForm(emptyReview); }}><Field label="اسم العميل" value={form.author_name} onChange={(value) => setForm({ ...form, author_name: value })} placeholder="مثال: سارة م." /><label className="admin-field">الخدمة<select required value={form.service_id || ""} onChange={(event) => setForm({ ...form, service_id: Number(event.target.value) })}><option value="" disabled>اختر الخدمة</option>{data.services.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}</select></label><Field label="نص المراجعة" value={form.content} multiline onChange={(value) => setForm({ ...form, content: value })} placeholder="اكتب تجربة العميل بعد الحصول على موافقته." /><div className="form-grid"><Field label="التقييم من 1 إلى 5" value={String(form.rating)} type="number" onChange={(value) => setForm({ ...form, rating: Number(value) })} /><Field label="ترتيب العرض" value={String(form.sort_order)} type="number" onChange={(value) => setForm({ ...form, sort_order: Number(value) })} /></div><label className="toggle-field"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /><span>تظهر على الموقع</span></label><p className="editor-help">اختر الخدمة المرتبطة بالتجربة. المراجعات الواردة من الموقع تبدأ غير منشورة حتى يقرر الدكتور حالتها.</p></EditorForm></div></div>;
}

function EditorForm({ title, onSubmit, onCancel, children }: { title: string; onSubmit: (event: FormEvent) => void; onCancel: () => void; children: React.ReactNode }) {
  return <form className="admin-panel-card editor-form" onSubmit={onSubmit}><div className="panel-heading"><div><span className="panel-kicker">تحرير المحتوى</span><h3>{title}</h3></div></div>{children}<div className="editor-form-actions"><button type="submit" className="admin-primary-button">حفظ التغييرات</button><button type="button" className="admin-cancel-button" onClick={onCancel}>إلغاء</button></div></form>;
}

function UploadField({ label, folder, value, onUploaded }: { label: string; folder: "services" | "offers" | "gallery"; value: string; onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const body = new FormData();
    body.append("file", file);
    body.append("folder", folder);
    try {
      const response = await fetch("/api/admin/uploads", { method: "POST", body });
      const payload = await response.json() as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error || "تعذر رفع الصورة.");
      onUploaded(payload.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "تعذر رفع الصورة.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return <div className="admin-upload-field"><label className="admin-field"><span>{label}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={upload} disabled={uploading} /></label>{value && <div className="upload-preview"><img src={value} alt="معاينة الصورة" /><div><strong>{uploading ? "جارٍ الرفع..." : "الصورة جاهزة للحفظ"}</strong><small>سيتم حفظها مع محتوى القسم بعد الضغط على حفظ التغييرات.</small></div></div>} {!value && <p className="upload-empty">اختر صورة من جهازك — JPG أو PNG أو WEBP أو AVIF، بحد أقصى 4.5MB.</p>}{error && <p className="form-error">{error}</p>}</div>;
}

function Field({ label, value, onChange, type = "text", multiline = false, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; multiline?: boolean; placeholder?: string }) {
  return <label className="admin-field">{label}{multiline ? <textarea required value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} /> : <input required type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />}</label>;
}

function EmptyState({ label }: { label: string }) { return <div className="empty-state"><span className="empty-state-mark"><AdminIcon name="empty" size={22} /></span><p>{label}</p></div>; }
