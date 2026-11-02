import type { Metadata, Viewport } from "next";
import { Barlow_Semi_Condensed, Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { NavegacionMovil, Sidebar } from "@/components/navegacion";
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
      <body className="min-h-full bg-fondo text-tinta">
        <Sidebar />
        <div className="flex min-h-dvh flex-col md:pl-20 lg:pl-64">
          <header className="sticky top-0 z-20 bg-cabina pt-[env(safe-area-inset-top)] md:hidden">
            <div className="flex h-14 items-center justify-center">
              <Link
                href="/viajes"
                aria-label="TransVelsa, inicio"
                className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
              >
                {/* El logo es cuadrado con fondo negro: se recorta a 2:1 para quitar el margen. */}
                <Image
                  src="/Transveliz.jpeg"
                  alt="TransVelsa"
                  width={1024}
                  height={1024}
                  sizes="96px"
                  loading="eager"
                  className="h-12 w-24 object-cover object-[50%_45%]"
                />
              </Link>
            </div>
            <div className="franja-marca h-[3px]" />
          </header>
          <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 md:pt-8 md:pb-10 lg:px-8">
            {children}
          </main>
        </div>
        <NavegacionMovil />
      </body>
    </html>
  );
}
