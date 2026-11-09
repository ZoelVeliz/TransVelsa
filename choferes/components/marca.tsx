import Image from "next/image";
import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "./iconos";

/** Logo redondo con aro plateado. */
export function Logo({ tamano = 48, prioridad }: { tamano?: number; prioridad?: boolean }) {
  return (
    <Image
      src="/Transveliz.jpeg"
      alt="TransVelsa"
      width={tamano}
      height={tamano}
      priority={prioridad}
      className="shrink-0 rounded-full bg-cabina object-cover ring-2 ring-white/15"
      style={{ width: tamano, height: tamano }}
    />
  );
}

/** Banda negra superior con franjas del camión; respeta la muesca del iPhone. */
export function Cabecera({ children }: { children: ReactNode }) {
  return (
    <header className="relative overflow-hidden bg-cabina text-white">
      <div aria-hidden className="franjas-diagonales absolute inset-y-0 right-0 w-2/3 opacity-60" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_0%,rgb(29_78_216/0.35),transparent_60%)]"
      />
      <div className="relative mx-auto w-full max-w-xl px-[max(1rem,env(safe-area-inset-left))] pt-[calc(1rem+env(safe-area-inset-top))] pb-6">
        {children}
      </div>
      <div aria-hidden className="franja-marca relative h-1.5" />
    </header>
  );
}

/** Pantalla completa de aviso (portada, enlace no válido, error). */
export function PantallaAviso({
  icono,
  titulo,
  children,
  acciones,
}: {
  icono: NombreIcono;
  titulo: string;
  children: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-cabina px-5 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))] text-white">
      <div aria-hidden className="franjas-diagonales absolute inset-x-0 top-0 h-56 opacity-40" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_0%,rgb(29_78_216/0.35),transparent_70%)]"
      />
      <div className="relative flex w-full max-w-sm flex-col items-center text-center animate-entrada">
        <Logo tamano={152} prioridad />
        <p className="mt-5 font-display text-2xl font-bold tracking-tight">
          TransVelsa <span className="text-plata">Choferes</span>
        </p>
        <div aria-hidden className="franja-marca mt-3 h-1 w-16 rounded-full" />

        <div className="mt-8 w-full rounded-tarjeta bg-superficie p-6 text-left text-tinta shadow-elevada">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-marca-50 text-marca ring-1 ring-marca/15">
              <Icono nombre={icono} className="size-6" />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-[1.5rem] leading-tight font-bold">{titulo}</h1>
              <div className="mt-2 space-y-2 text-base leading-relaxed text-tenue">{children}</div>
            </div>
          </div>
          {acciones && <div className="mt-5">{acciones}</div>}
        </div>
      </div>
    </main>
  );
}
