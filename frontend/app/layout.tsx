import type { Metadata, Viewport } from "next";
import { Barlow_Semi_Condensed, Geist, Geist_Mono } from "next/font/google";
import { EncabezadoMovil, NavegacionMovil, Sidebar } from "@/components/navegacion";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Solo para títulos; las cifras van siempre en Geist con tabular-nums.
const barlow = Barlow_Semi_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TransVelsa",
  description: "Planificación de viajes, gastos y liquidación de pilotos",
  icons: { icon: "/Transveliz.jpeg", apple: "/Transveliz.jpeg" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  viewportFit: "cover",
};

// Sin nada dinámico (fechas, semana actual): con cacheComponents rompería el prerender.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="fondo-pagina min-h-full text-tinta">
        <a
          href="#contenido"
          className="sr-only z-50 rounded-control bg-marca px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Saltar al contenido
        </a>
        <Sidebar />
        <div className="flex min-h-dvh flex-col md:pl-20 lg:pl-64">
          <EncabezadoMovil />
          <main
            id="contenido"
            className="mx-auto w-full max-w-[1440px] flex-1 space-y-6 px-4 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 md:pt-8 md:pb-12 lg:px-8 xl:px-10"
          >
            {children}
          </main>
        </div>
        <NavegacionMovil />
      </body>
    </html>
  );
}
