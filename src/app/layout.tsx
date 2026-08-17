import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://dr-layan.com"),
  title: {
    default: "د. ليان | طب أسنان دقيق، ابتسامة تشبهك",
    template: "%s | عيادة د. ليان",
  },
  description: "عيادة د. ليان لطب الأسنان التجميلي والترميمي في إب، اليمن. عناية هادئة، تخطيط رقمي، ونتائج طبيعية مصممة حولك.",
  keywords: ["طبيب أسنان إب", "طبيب أسنان اليمن", "تجميل الأسنان", "ابتسامة هوليود", "زراعة الأسنان", "تقويم شفاف"],
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/ceramic-molar-icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/ceramic-molar-icon.png", type: "image/png", sizes: "512x512" }],
  },
  openGraph: {
    title: "د. ليان | طب أسنان دقيق، ابتسامة تشبهك",
    description: "عناية هادئة ونتائج طبيعية في عيادة د. ليان في إب، اليمن.",
    url: "https://dr-layan.com",
    siteName: "عيادة د. ليان",
    locale: "ar_YE",
    type: "website",
    images: [{ url: "/og-dental-clinic.jpg", width: 1600, height: 900, alt: "ضرس خزفي بتصميم هادئ لعيادة د. ليان" }],
  },
  twitter: { card: "summary_large_image", title: "د. ليان | طب أسنان دقيق، ابتسامة تشبهك", description: "عناية هادئة ونتائج طبيعية في عيادة د. ليان في إب، اليمن.", images: ["/og-dental-clinic.jpg"] },
  robots: { index: true, follow: true },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Dentist",
  name: "عيادة د. ليان",
  description: "عيادة متخصصة في طب الأسنان التجميلي والترميمي.",
  url: "https://dr-layan.com",
  telephone: "+967780500363",
  address: { "@type": "PostalAddress", addressLocality: "إب", addressCountry: "YE" },
  medicalSpecialty: "Dentistry",
  image: "https://dr-layan.com/og-dental-clinic.jpg",
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
