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
      className="shrink-0 rounded-full bg-cabina object-cover shadow-[0_8px_24px_-8px_rgb(36_80_230/0.7)] ring-1 ring-white/20"
      style={{ width: tamano, height: tamano }}
    />
  );
}

/** Banda negra superior con franjas del camión; respeta la muesca del iPhone. */
export function Cabecera({ children }: { children: ReactNode }) {
  return (
    <header className="panel-oscuro relative isolate overflow-hidden rounded-b-[2rem] text-white shadow-[0_24px_48px_-24px_rgb(7_8_12/0.7)]">
      <div aria-hidden className="franjas-diagonales absolute inset-y-0 right-0 -z-10 w-3/4 opacity-90" />
      {/* Rejilla tenue tipo Linear */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.04)_1px,transparent_1px)] mask-[radial-gradient(ellipse_80%_70%_at_50%_0%,#000_30%,transparent_80%)] bg-size-[40px_40px]"
      />
      <div className="relative mx-auto w-full max-w-xl px-[max(1rem,env(safe-area-inset-left))] pt-[calc(1rem+env(safe-area-inset-top))] pb-7">
        {children}
      </div>
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
    <main className="panel-oscuro relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))] text-white">
      <div aria-hidden className="franjas-diagonales absolute inset-x-0 top-0 -z-10 h-72 opacity-70" />
      <div
        aria-hidden
        className="absolute top-1/3 left-1/2 -z-10 size-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(36_80_230/0.35),transparent)]"
      />
      <div className="relative flex w-full max-w-sm flex-col items-center text-center animate-entrada">
        <Logo tamano={152} prioridad />
        <p className="mt-5 font-display text-2xl font-semibold tracking-tight">
          TransVelsa <span className="text-plata">Choferes</span>
        </p>
        <div aria-hidden className="franja-marca mt-3 h-px w-16 rounded-full" />

        <div className="mt-8 w-full rounded-tarjeta bg-white/[0.06] p-6 text-left text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_24px_48px_-20px_rgb(0_0_0/0.6)] ring-1 ring-white/10 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-blue-300 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] ring-1 ring-white/10">
              <Icono nombre={icono} className="size-6" />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-[1.5rem] leading-tight font-semibold">{titulo}</h1>
              <div className="mt-2 space-y-2 text-base leading-relaxed text-slate-300">{children}</div>
            </div>
          </div>
          {acciones && <div className="mt-5">{acciones}</div>}
        </div>
      </div>
    </main>
  );
}
