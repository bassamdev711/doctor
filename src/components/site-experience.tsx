"use client";

/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

type Service = {
  id?: number;
  number: string;
  title: string;
  english: string;
  description: string;
  image_url: string;
};

type Offer = {
  id: number;
  title: string;
  description: string;
  discount_percent: number;
  valid_until: string | null;
  image_url: string;
};

type GalleryItem = {
  id: number;
  src: string;
  title: string;
  label: string;
};

type Review = {
  id: number;
  author_name: string;
  content: string;
  service_name: string;
  rating: number;
};

const fallbackServices: Service[] = [
  { number: "01", title: "ابتسامة هوليود", english: "Smile design", description: "تصميم ابتسامة شخصية يوازن بين ملامح الوجه، النسب، والنتيجة الطبيعية.", image_url: "/hero-porcelain.jpg" },
  { number: "02", title: "زراعة الأسنان", english: "Implantology", description: "حلول دقيقة لاستعادة الوظيفة والثقة بخطة علاج هادئة وواضحة.", image_url: "/treatment-detail.jpg" },
  { number: "03", title: "التقويم الشفاف", english: "Clear aligners", description: "حركة محسوبة وابتسامة أكثر تناغمًا دون التنازل عن إيقاع حياتك.", image_url: "/clinic-interior.jpg" },
  { number: "04", title: "العناية الوقائية", english: "Preventive care", description: "فحوصات وتنظيف وعادات بسيطة تحافظ على صحة ابتسامتك على المدى الطويل.", image_url: "/doctor-portrait.jpg" },
];

const fallbackGallery: GalleryItem[] = [
  { id: 1, src: "/clinic-interior.jpg", title: "مساحة تستقبلك بهدوء", label: "RECEPTION" },
  { id: 2, src: "/treatment-detail.jpg", title: "تقنية لا تطغى على التجربة", label: "DETAILS" },
  { id: 3, src: "/hero-porcelain.jpg", title: "الجمال في التفاصيل", label: "ATMOSPHERE" },
];

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" className="arrow-icon"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function SparkIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="spark-icon"><path d="M12 2.8c.8 5 1.8 7 6.7 8.2-4.9 1.2-5.9 3.2-6.7 8.2-.8-5-1.8-7-6.7-8.2C10.2 9.8 11.2 7.8 12 2.8Z" fill="currentColor" /></svg>;
}

function SectionEyebrow({ index, children }: { index: string; children: ReactNode }) {
  return <div className="section-eyebrow"><span>{index}</span><i /><p>{children}</p></div>;
}

export default function SiteExperience() {
  const [services, setServices] = useState<Service[]>(fallbackServices);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>(fallbackGallery);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeService, setActiveService] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [beforeAfter, setBeforeAfter] = useState(52);

  const handleHeroPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty("--hero-tilt-x", `${(x * 3.2).toFixed(2)}deg`);
    event.currentTarget.style.setProperty("--hero-tilt-y", `${(y * -2.2).toFixed(2)}deg`);
    event.currentTarget.style.setProperty("--hero-shift-x", `${(x * -9).toFixed(2)}px`);
    event.currentTarget.style.setProperty("--hero-shift-y", `${(y * -6).toFixed(2)}px`);
  };

  const resetHeroPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty("--hero-tilt-x", "0deg");
    event.currentTarget.style.setProperty("--hero-tilt-y", "0deg");
    event.currentTarget.style.setProperty("--hero-shift-x", "0px");
    event.currentTarget.style.setProperty("--hero-shift-y", "0px");
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/content")
      .then(async (response) => {
        if (!response.ok) throw new Error("content-unavailable");
        return response.json() as Promise<{ services: Array<Service & { id: number }>; offers: Offer[]; media: Array<{ id: number; title: string; label: string; image_url: string }>; reviews: Review[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        if (data.services?.length) {
          setServices(data.services.map((service, index) => ({ ...service, number: String(index + 1).padStart(2, "0") })));
        }
        if (data.offers) setOffers(data.offers);
        if (data.media?.length) setGallery(data.media.map((item) => ({ id: item.id, src: item.image_url, title: item.title, label: item.label })));
        if (data.reviews) setReviews(data.reviews);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const currentService = useMemo(() => services[Math.min(activeService, services.length - 1)] ?? fallbackServices[0], [activeService, services]);
  const galleryIndex = offers.length ? (reviews.length ? "08" : "07") : (reviews.length ? "07" : "06");
  const contactIndex = offers.length ? (reviews.length ? "09" : "08") : (reviews.length ? "08" : "07");
  const navigation = [
    ...(offers.length ? [{ href: "#offers", label: "العروض" }] : []),
    { href: "#philosophy", label: "فلسفتنا" },
    { href: "#services", label: "الخدمات" },
    { href: "#doctor", label: "الطبيبة" },
    { href: "#gallery", label: "العيادة" },
  ];

  const handleBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          phone: formData.get("phone"),
          service: formData.get("service"),
          preferredDate: formData.get("date"),
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "تعذر تسجيل الطلب.");
      form.reset();
      setSubmitted(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "تعذر تسجيل الطلب الآن.");
    } finally {
      setSubmitting(false);
    }
  };

  const openBooking = () => {
    setSubmitted(false);
    setFormError("");
    setBookingOpen(true);
    setMobileOpen(false);
  };

  return (
    <main dir="rtl" className="site-shell">
      <header className="site-header">
        <a className="brand-mark" href="#top" aria-label="عيادة د. ليان الرئيسية"><span className="brand-symbol"><span /></span><span className="brand-copy"><strong>د. ليان</strong><small>عيادة أسنان</small></span></a>
        <nav className={`site-nav ${mobileOpen ? "is-open" : ""}`} aria-label="التنقل الرئيسي">
          {navigation.map((item) => <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>{item.label}</a>)}
        </nav>
        <div className="header-actions"><a href="tel:+966112345678" className="phone-link"><span>+966 11 234 5678</span></a><button className="outline-button header-cta" onClick={openBooking}>احجز موعدًا <ArrowIcon /></button><button className="menu-toggle" aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((value) => !value)}><span /><span /></button></div>
      </header>

      <section id="top" className="hero-section">
        <div className="hero-art" aria-hidden="true" onPointerMove={handleHeroPointerMove} onPointerLeave={resetHeroPointer}><Image src="/hero-porcelain.jpg" alt="" fill priority sizes="(max-width: 900px) 100vw, 54vw" /><div className="hero-art-wash" /><div className="hero-art-label">PRECISION / 01</div><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /></div>
        <div className="hero-content page-width"><div className="hero-kicker"><span className="kicker-line" /> طب الأسنان التجميلي والترميمي</div><h1>ابتسامتك،<br /><em>بصياغة أدق.</em></h1><p className="hero-intro">نصمم علاجًا يليق بتفاصيلك — علمٌ دقيق، حضورٌ هادئ، ونتيجة تشبهك.</p><div className="hero-actions"><button className="primary-button" onClick={openBooking}>ابدأ رحلتك <ArrowIcon /></button><a className="text-button" href="#philosophy">اكتشف فلسفتنا <ArrowIcon /></a></div></div>
        <div className="hero-meta page-width"><div className="hero-note"><SparkIcon /><span>عناية تتجاوز التوقعات<br /><small>من أول استشارة</small></span></div><div className="scroll-cue"><span>مرر للاستكشاف</span><i /></div><div className="hero-stats"><strong>12</strong><span>عامًا من<br />الخبرة الهادئة</span></div></div>
      </section>

      <section id="philosophy" className="philosophy-section page-width section-space"><SectionEyebrow index="01">الفكرة وراء العيادة</SectionEyebrow><div className="philosophy-grid"><div className="philosophy-title-wrap"><h2>الدقة<br /><span>تلتقي</span><br />بالجمال.</h2></div><div className="philosophy-copy"><p className="lead-copy">في عيادة د. ليان، لا نبحث عن ابتسامة مثالية بمعيار واحد. نبحث عن التوازن الذي يجعلها تبدو وكأنها كانت دائمًا لك.</p><p>نبدأ بالاستماع، ثم نستخدم أحدث أدوات التشخيص لنصنع خطة واضحة ونتيجة طبيعية. لأن أفضل علاج هو الذي يمنحك ثقة أكبر، وقلقًا أقل.</p><a className="text-button dark-button" href="#doctor">تعرّف على الطبيبة <ArrowIcon /></a></div><div className="philosophy-side-note"><span>02</span><p>النتيجة الحقيقية<br />تشعر بها قبل أن يلاحظها الآخرون.</p></div></div></section>

      <section id="services" className="services-section section-space"><div className="page-width"><SectionEyebrow index="02">مجالات العناية</SectionEyebrow><div className="services-heading"><h2>خبرة واضحة.<br /><em>خيارات محسوبة.</em></h2><p>خدمات مصممة حول احتياجك، لا حول قائمة جاهزة.</p></div><div className="services-layout"><div className="services-list" role="list" aria-label="الخدمات">{services.map((service, index) => <button key={service.id ?? service.title} className={`service-row ${activeService === index ? "is-active" : ""}`} onMouseEnter={() => setActiveService(index)} onFocus={() => setActiveService(index)} onClick={() => setActiveService(index)}><span className="service-number">{service.number}</span><span className="service-name"><strong>{service.title}</strong><small>{service.english}</small></span><span className="service-arrow"><ArrowIcon /></span></button>)}</div><div className="service-feature" aria-live="polite"><div className="service-feature-image"><img src={currentService.image_url} alt="" /><div className="dynamic-image-shade" /></div><div className="service-feature-copy"><span>{currentService.number} / {currentService.english}</span><p>{currentService.description}</p></div></div></div></div></section>

      {offers.length > 0 && <section id="offers" className="offers-section section-space"><div className="page-width"><SectionEyebrow index="03">عروض العيادة</SectionEyebrow><div className="offers-heading"><h2>فرصة أجمل<br /><em>لبداية أهدأ.</em></h2><p>عروض محدودة تختارها العيادة بعناية لتمنحك خطوة أولى أسهل.</p></div><div className="offers-grid">{offers.map((offer) => <article key={offer.id} className="offer-card"><img src={offer.image_url} alt="" /><div className="offer-card-content"><span className="offer-discount">{offer.discount_percent}%</span><h3>{offer.title}</h3><p>{offer.description}</p>{offer.valid_until && <small>متاح حتى {offer.valid_until}</small>}<button className="text-button dark-button" onClick={openBooking}>استفد من العرض <ArrowIcon /></button></div></article>)}</div></div></section>}

      <section id="doctor" className="doctor-section section-space page-width"><div className="doctor-photo"><Image src="/doctor-portrait.jpg" alt="د. ليان، طبيبة أسنان" fill sizes="(max-width: 900px) 100vw, 45vw" /><span className="photo-stamp">DR. LAYAN<br /><small>PRECISION IN CARE</small></span></div><div className="doctor-copy"><SectionEyebrow index={offers.length ? "04" : "03"}>الطبيبة</SectionEyebrow><h2>يدٌ خبيرة،<br /><em>وقلبٌ يصغي.</em></h2><p className="lead-copy">د. ليان العتيبي طبيبة أسنان متخصصة في التجميل والترميم، تؤمن أن الثقة تبدأ من شعورك بأنك مفهوم.</p><p>بخبرة تمتد لأكثر من 12 عامًا، تجمع بين التخطيط الرقمي واللمسة الإنسانية لتقديم علاجات دقيقة، متأنية، ومصممة خصيصًا لك.</p><div className="doctor-credentials"><div><strong>12+</strong><span>سنوات خبرة</span></div><div><strong>3</strong><span>اعتمادات دولية</span></div><div><strong>1:1</strong><span>رعاية شخصية</span></div></div><a className="text-button dark-button" href="#contact">تواصل مع العيادة <ArrowIcon /></a></div></section>

      <section className="principles-section section-space"><div className="page-width"><SectionEyebrow index={offers.length ? "05" : "04"}>لماذا د. ليان</SectionEyebrow><div className="principles-intro"><h2>لا نعدك<br /><em>بالمزيد.</em><br />نعدك بالأفضل.</h2><p>كل قرار علاجي لدينا يمر عبر أربعة مبادئ بسيطة: الدقة، الوضوح، الراحة، والنتيجة الطبيعية.</p></div><div className="principles-list"><div><span>01</span><strong>دقة تشخيصية</strong><p>نرى الصورة كاملة قبل أن نبدأ.</p></div><div><span>02</span><strong>خطة مفهومة</strong><p>تعرف ماذا سنفعل ولماذا.</p></div><div><span>03</span><strong>راحة مستمرة</strong><p>تجربة هادئة في كل زيارة.</p></div><div><span>04</span><strong>نتيجة طبيعية</strong><p>ابتسامة تشبهك، لا نسخة من أحد.</p></div></div></div></section>

      <section className="transformation-section section-space page-width"><SectionEyebrow index={offers.length ? "06" : "05"}>الفرق الذي يُرى ويُحس</SectionEyebrow><div className="transformation-heading"><h2>تحول محسوب.<br /><em>أثرٌ يدوم.</em></h2><p>نؤمن بأن التغيير الجميل لا يحتاج إلى مبالغة. اسحب المؤشر لترى مثالًا على توازن التفاصيل.</p></div><div className="before-after" style={{ "--split": `${beforeAfter}%` } as React.CSSProperties}><div className="ba-image ba-after"><Image src="/hero-porcelain.jpg" alt="نتيجة بعد العلاج" fill sizes="(max-width: 900px) 100vw, 80vw" /></div><div className="ba-image ba-before"><Image src="/treatment-detail.jpg" alt="الحالة قبل العلاج" fill sizes="(max-width: 900px) 100vw, 80vw" /></div><div className="ba-handle" aria-hidden="true"><span>↔</span></div><label className="sr-only" htmlFor="before-after-range">مقارنة الحالة قبل وبعد</label><input id="before-after-range" type="range" min="15" max="85" value={beforeAfter} onChange={(event) => setBeforeAfter(Number(event.target.value))} /><div className="ba-label ba-label-before">قبل</div><div className="ba-label ba-label-after">بعد</div></div></section>

      {reviews.length > 0 && <section className="testimonial-section section-space"><div className="page-width testimonial-inner"><SectionEyebrow index={offers.length ? "07" : "06"}>كلمات نعتز بها</SectionEyebrow><div className="testimonial-grid">{reviews.map((review) => <article className="testimonial-card" key={review.id}><span className="testimonial-score">تقييم {review.rating}/5</span><blockquote>“{review.content}”</blockquote><div className="testimonial-meta"><span>{review.author_name}</span><span>{review.service_name}</span><span className="quote-mark" aria-hidden="true">“</span></div></article>)}</div></div></section>}

      <section id="gallery" className="gallery-section section-space page-width"><SectionEyebrow index={galleryIndex}>من داخل العيادة</SectionEyebrow><div className="gallery-heading"><h2>مساحة صُممت<br /><em>لتطمئن.</em></h2><p>تفاصيل معمارية ناعمة، تقنية متقدمة، ووقت يُمنح لك بالكامل.</p></div><div className="gallery-grid">{gallery.map((item, index) => <article key={item.id} className={`gallery-item gallery-${(index % 3) + 1}`}><img src={item.src} alt={item.title} /><div className="gallery-overlay"><span>{item.label}</span><strong>{item.title}</strong></div></article>)}</div></section>

      <section id="contact" className="booking-section section-space page-width"><div className="booking-card"><div><SectionEyebrow index={contactIndex}>الخطوة الأولى</SectionEyebrow><h2>لابتسامتك<br /><em>موعد يستحقها.</em></h2><p>اترك لنا تفاصيل بسيطة، وسيتواصل معك فريقنا لتنسيق استشارتك الأولى.</p></div><div className="booking-actions"><button className="light-button" onClick={openBooking}>احجز موعدًا <ArrowIcon /></button><a className="booking-phone" href="tel:+966112345678"><span>أو اتصل بنا مباشرة</span><strong>+966 11 234 5678</strong></a></div></div></section>

      <footer className="site-footer page-width"><a className="brand-mark" href="#top"><span className="brand-symbol"><span /></span><span className="brand-copy"><strong>د. ليان</strong><small>عيادة أسنان</small></span></a><div className="footer-links">{navigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}</div><div className="footer-contact"><span>الرياض، المملكة العربية السعودية</span><a href="mailto:hello@dr-layan.com">hello@dr-layan.com</a></div><div className="footer-bottom"><span>© 2026 عيادة د. ليان. جميع الحقوق محفوظة.</span><span>Precision meets beauty.</span></div></footer>

      {bookingOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setBookingOpen(false); }}><div className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title"><button className="modal-close" onClick={() => setBookingOpen(false)} aria-label="إغلاق نموذج الحجز">×</button>{submitted ? <div className="success-state"><div className="success-icon">✓</div><h2>وصل طلبك.</h2><p>شكرًا لثقتك. سيتواصل معك فريق العيادة خلال ساعات العمل لتأكيد الموعد.</p><button className="primary-button" onClick={() => setBookingOpen(false)}>تم <ArrowIcon /></button></div> : <><SectionEyebrow index="10">حجز موعد</SectionEyebrow><h2 id="booking-title">لنبدأ<br /><em>منك.</em></h2><p className="modal-intro">املأ البيانات التالية وسنعاود الاتصال بك لتأكيد الوقت الأنسب.</p><form onSubmit={handleBooking} className="booking-form"><label>الاسم الكامل<input required name="name" placeholder="اكتب اسمك" /></label><label>رقم الهاتف<input required name="phone" type="tel" placeholder="05x xxx xxxx" /></label><label>الخدمة<select required name="service" defaultValue=""><option value="" disabled>اختر الخدمة</option>{services.map((service) => <option key={service.id ?? service.title} value={service.title}>{service.title}</option>)}</select></label><label>الوقت المفضل<input required name="date" type="date" min={new Date().toISOString().slice(0, 10)} /></label>{formError && <p className="form-error" role="alert">{formError}</p>}<button disabled={submitting} type="submit" className="primary-button form-submit">{submitting ? "جارٍ إرسال الطلب..." : "إرسال الطلب"} <ArrowIcon /></button></form></>}</div></div>}
    </main>
  );
}
