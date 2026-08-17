import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://dr-layan.com"),
  title: {
    default: "د. ليان | طب أسنان دقيق، ابتسامة تشبهك",
    template: "%s | عيادة د. ليان",
  },
  description: "عيادة د. ليان لطب الأسنان التجميلي والترميمي في الرياض. عناية هادئة، تخطيط رقمي، ونتائج طبيعية مصممة حولك.",
  keywords: ["طبيب أسنان الرياض", "تجميل الأسنان", "ابتسامة هوليود", "زراعة الأسنان", "تقويم شفاف"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "د. ليان | طب أسنان دقيق، ابتسامة تشبهك",
    description: "عناية هادئة ونتائج طبيعية في عيادة د. ليان بالرياض.",
    url: "https://dr-layan.com",
    siteName: "عيادة د. ليان",
    locale: "ar_SA",
    type: "website",
    images: [{ url: "/hero-porcelain-left.png", width: 2560, height: 1440, alt: "تفصيل خزفي مستوحى من طب الأسنان" }],
  },
  twitter: { card: "summary_large_image", title: "د. ليان | طب أسنان دقيق، ابتسامة تشبهك", description: "عناية هادئة ونتائج طبيعية في عيادة د. ليان بالرياض.", images: ["/hero-porcelain-left.png"] },
  robots: { index: true, follow: true },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Dentist",
  name: "عيادة د. ليان",
  description: "عيادة متخصصة في طب الأسنان التجميلي والترميمي.",
  url: "https://dr-layan.com",
  telephone: "+966112345678",
  address: { "@type": "PostalAddress", addressLocality: "الرياض", addressCountry: "SA" },
  medicalSpecialty: "Dentistry",
  image: "https://dr-layan.com/hero-porcelain-left.png",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </body>
    </html>
  );
}
