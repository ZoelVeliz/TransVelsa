import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
        <a
          href="#contenido"
          className="sr-only z-50 rounded-control bg-marca px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:inline-flex focus:min-h-11 focus:items-center focus:top-[calc(0.75rem+env(safe-area-inset-top))] focus:left-3 focus:shadow-elevada focus:outline-2 focus:outline-offset-2 focus:outline-white focus:ring-2 focus:ring-marca"
        >
          Saltar al contenido
        </a>
        <Sidebar />
        <div className="flex min-h-dvh flex-col md:pl-20 lg:pl-64">
          <EncabezadoMovil />
          <main
            id="contenido"
            tabIndex={-1}
            className="mx-auto w-full max-w-[1440px] flex-1 space-y-6 px-4 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom))] outline-none sm:px-6 md:pt-10 md:pb-14 lg:px-10 xl:px-12"
          >
            {children}
          </main>
        </div>
        <NavegacionMovil />
      </body>
    </html>
  );
}
