import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { Icono, type NombreIcono } from "@/components/iconos";
import { FormularioLogin } from "./formulario";

export const metadata: Metadata = {
  title: "Entrar · TransVelsa",
  robots: { index: false, follow: false },
};

// Lo que de verdad hace el panel (nada de cifras inventadas).
const MODULOS: { icono: NombreIcono; titulo: string; texto: string }[] = [
  { icono: "camion", titulo: "Viajes y asignación", texto: "Pedidos, camión, piloto y estatus en tiempo real" },
  { icono: "usuarios", titulo: "Choferes y liquidación", texto: "Tarifario, viáticos, adelantos y total a pagar" },
  { icono: "billetera", titulo: "Diésel, gastos y caja", texto: "Quién puso el dinero y el saldo de cada cuenta" },
  { icono: "grafica", titulo: "Reportes", texto: "Ingresos contra gastos por semana, exportables a Excel" },
];

export default function PaginaLogin() {
  return (
    <main className="panel-oscuro relative isolate grid min-h-dvh overflow-hidden text-white lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* Fondo: rejilla tenue + halos (decorativo) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.035)_1px,transparent_1px)] mask-[radial-gradient(ellipse_80%_70%_at_30%_40%,#000_20%,transparent_75%)] bg-size-[48px_48px]"
      />
      <div
        aria-hidden
        className="absolute top-1/3 left-1/4 -z-10 size-[46rem] -translate-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(36_80_230/0.3),transparent)]"
      />
      <div
        aria-hidden
        className="absolute right-0 bottom-0 -z-10 size-[34rem] translate-x-1/3 translate-y-1/3 rounded-full bg-[radial-gradient(closest-side,rgb(229_50_62/0.16),transparent)]"
      />

      {/* ---- Presentación (solo pantallas grandes) ---- */}
      <section
        aria-label="TransVelsa"
        className="relative hidden flex-col justify-between border-r border-white/[0.06] px-12 py-12 lg:flex xl:px-16"
      >
        <Image
          src="/Transveliz.jpeg"
          alt="TransVelsa"
          width={1024}
          height={1024}
          sizes="180px"
          loading="eager"
          className="h-[86px] w-[172px] rounded-2xl object-cover object-[50%_45%] shadow-[0_20px_50px_-15px_rgb(36_80_230/0.6)] ring-1 ring-white/10"
        />

        <div className="max-w-xl py-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] py-1 pr-3 pl-2 text-eyebrow font-medium tracking-[0.08em] text-blue-200 uppercase ring-1 ring-white/10">
            <span aria-hidden className="size-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgb(96_165_250)]" />
            Transporte de carga · Guatemala
          </p>
          <h2 className="mt-5 bg-linear-to-b from-white to-white/60 bg-clip-text font-display text-[clamp(2.25rem,3.6vw,3.25rem)] leading-[1.05] font-semibold tracking-[-0.035em] text-transparent">
            Toda la operación,
            <br />
            en un solo lugar.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-400">
            Del pedido a la entrega y de la entrega a la liquidación: la oficina de TransVelsa trabaja aquí.
          </p>

          <Ruta />

          <ul className="mt-8 grid grid-cols-2 gap-3">
            {MODULOS.map((m, i) => (
              <li
                key={m.titulo}
                style={{ animationDelay: `${150 + i * 70}ms` }}
                className="rounded-2xl bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] ring-1 ring-white/[0.07] animate-entrada"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-white/[0.07] text-blue-300 ring-1 ring-white/10">
                  <Icono nombre={m.icono} className="size-4" />
                </span>
                <p className="mt-3 text-sm font-semibold text-white">{m.titulo}</p>
                <p className="mt-0.5 text-xs leading-snug text-slate-400">{m.texto}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="flex items-center gap-2 text-xs text-slate-500">
          <Icono nombre="candado" className="size-3.5" />
          Acceso solo para personal autorizado de TransVelsa.
        </p>
      </section>

      {/* ---- Formulario ---- */}
      <section className="flex items-center justify-center px-4 pt-[calc(2.5rem+env(safe-area-inset-top))] pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:px-8">
        <div className="w-full max-w-[25rem] animate-entrada">
          {/* Logo arriba solo en celular/tablet (en grande va en la presentación) */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <Image
              src="/Transveliz.jpeg"
              alt="TransVelsa"
              width={1024}
              height={1024}
              sizes="176px"
              loading="eager"
              className="h-22 w-44 rounded-2xl object-cover object-[50%_45%] shadow-[0_20px_50px_-15px_rgb(36_80_230/0.6)] ring-1 ring-white/10"
            />
            <p className="mt-4 text-sm text-slate-400">Panel de oficina</p>
          </div>

          <div className="relative rounded-[28px] bg-white/[0.05] p-6 shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_40px_80px_-24px_rgb(0_0_0/0.75)] ring-1 ring-white/10 backdrop-blur-xl sm:p-8">
            {/* Filo de luz superior */}
            <div
              aria-hidden
              className="absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-blue-300/60 to-transparent"
            />
            <h1 className="font-display text-[1.625rem] leading-tight font-semibold tracking-tight">Inicia sesión</h1>
            <p className="mt-1.5 text-sm text-slate-400">Entra con el usuario que te dio un administrador.</p>
            <div className="mt-7">
              <Suspense fallback={<div className="h-[14rem]" />}>
                <FormularioLogin />
              </Suspense>
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
            ¿Olvidaste tu contraseña? Pide a un administrador
            <br className="sm:hidden" /> que te genere una nueva en Usuarios.
          </p>
        </div>
      </section>
    </main>
  );
}

/** Ruta animada: origen → camión en camino → entrega (decorativo). */
function Ruta() {
  return (
    <div aria-hidden className="mt-8 flex items-center gap-3 rounded-2xl bg-white/[0.03] px-4 py-3.5 ring-1 ring-white/[0.07]">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blue-500/15 ring-1 ring-blue-400/40">
        <span className="size-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgb(96_165_250)]" />
      </span>
      <div className="ruta relative h-px flex-1 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.25)_0_8px,transparent_8px_14px)]">
        <span className="ruta-camion absolute top-1/2 -translate-y-1/2 rounded-full bg-cabina p-1 text-white ring-1 ring-white/20">
          <Icono nombre="camion" className="size-4" />
        </span>
      </div>
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/40">
        <Icono nombre="check" className="size-3.5" grosor={2.5} />
      </span>
    </div>
  );
}
