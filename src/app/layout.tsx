import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://fitzo.app"),
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
    locale: "es_ES",
    url: "https://fitzo.app",
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
    canonical: "https://fitzo.app",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#C5A356",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        {children}
      </body>
    </html>
  );
}
