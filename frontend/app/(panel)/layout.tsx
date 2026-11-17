import { Suspense } from "react";
import { BarraSuperior, MenuUsuario } from "@/components/barra-superior";
import { PaletaComandos } from "@/components/comandos";
import { Destello } from "@/components/destello";
import { EncabezadoMovil, NavegacionMovil, Sidebar } from "@/components/navegacion";
import { usuarioActual } from "@/lib/sesion";

// Marco del panel de oficina (todo lo que exige sesión; ver proxy.ts).
export default function LayoutPanel({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-50 rounded-control bg-marca px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:inline-flex focus:min-h-11 focus:items-center focus:top-[calc(0.75rem+env(safe-area-inset-top))] focus:left-3 focus:shadow-elevada focus:outline-2 focus:outline-offset-2 focus:outline-white focus:ring-2 focus:ring-marca"
      >
        Saltar al contenido
      </a>
      <Sidebar />
      <div className="flex min-h-dvh flex-col md:pl-20 lg:pl-64">
        <EncabezadoMovil />
        <BarraSuperior
          usuario={
            <Suspense fallback={<span aria-hidden className="esqueleto h-9 w-28 rounded-full" />}>
              <CuentaActual />
            </Suspense>
          }
        />
        <main
          id="contenido"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1440px] flex-1 space-y-6 px-4 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom))] outline-none sm:px-6 md:pt-8 md:pb-14 lg:px-10 xl:px-12"
        >
          {children}
        </main>
      </div>
      <NavegacionMovil />
      <PaletaComandos />
      <Destello />
    </>
  );
}

// La cookie se lee por visita (dentro de Suspense, como pide Cache Components).
async function CuentaActual() {
  const yo = await usuarioActual();
  if (!yo) return null;
  return <MenuUsuario nombre={yo.nombre} usuario={yo.usuario} esAdmin={yo.esAdmin} />;
}
