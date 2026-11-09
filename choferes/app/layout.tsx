import type { Metadata, Viewport } from "next";
import { Barlow_Semi_Condensed, Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Solo para títulos y el destino de cada viaje.
const barlow = Barlow_Semi_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TransVelsa Choferes",
  description: "Tus viajes asignados: inicia la ruta y marca la entrega.",
  applicationName: "TransVelsa Choferes",
  // El token va en la URL: nada de esto debe aparecer en buscadores.
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
  icons: { apple: "/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${barlow.variable} h-full antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
