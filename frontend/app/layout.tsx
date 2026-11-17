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
  title: "TransVelsa",
  description: "Planificación de viajes, gastos y liquidación de pilotos",
  icons: { icon: "/Transveliz.jpeg", apple: "/Transveliz.jpeg" },
};

export const viewport: Viewport = {
  themeColor: "#07080c",
  viewportFit: "cover",
};

// Sin nada dinámico (fechas, semana actual): con cacheComponents rompería el prerender.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="fondo-pagina min-h-full text-tinta">
        {children}
      </body>
    </html>
  );
}
