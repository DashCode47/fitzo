import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fitzo.one"),
  title: {
    default: "Fitzo — Tu Transformación Comienza Hoy",
    template: "%s | Fitzo",
  },
  description:
    "Fitzo es el software de gestión para gimnasios que gamifica la experiencia de tus miembros. Check-in automático por geofencing, rankings, planes nutricionales y más — todo en una plataforma.",
  keywords: [
    "software para gimnasios",
    "gestión de gimnasio",
    "app para gym",
    "gamificación fitness",
    "retención de miembros",
    "check-in automático gimnasio",
    "Fitzo Legends ranking",
    "geofencing gimnasio",
    "plataforma fitness SaaS",
    "Fitzo",
  ],
  authors: [{ name: "Fitzo Team" }],
  creator: "Fitzo",
  publisher: "Fitzo",
  openGraph: {
    type: "website",
    locale: "es_EC",
    url: "https://fitzo.one",
    siteName: "Fitzo",
    title: "Fitzo — Tu Transformación Comienza Hoy",
    description:
      "La app de gestión de gimnasio gamificada. Compite, entrena y transforma tu cuerpo con Fitzo.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fitzo — Fitness App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fitzo — Tu Transformación Comienza Hoy",
    description:
      "La app de gestión de gimnasio gamificada. Compite, entrena y transforma tu cuerpo.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://fitzo.one",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7B2FF7",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-white`}
      >
        {/* Meta Pixel Code */}
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '26948158618128884');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=26948158618128884&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* End Meta Pixel Code */}
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
