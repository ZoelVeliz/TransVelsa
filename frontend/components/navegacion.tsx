"use client";

import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Icono, type NombreIcono } from "./iconos";

const enlaces: { href: string; texto: string; corto: string; icono: NombreIcono }[] = [
  { href: "/viajes", texto: "Viajes", corto: "Viajes", icono: "camion" },
  { href: "/choferes", texto: "Tarifario y choferes", corto: "Choferes", icono: "usuarios" },
  { href: "/gastos", texto: "Diésel y gastos", corto: "Gastos", icono: "bomba" },
  { href: "/movimientos", texto: "Caja y cuentas", corto: "Caja", icono: "billetera" },
  { href: "/reportes", texto: "Reportes", corto: "Reportes", icono: "grafica" },
];

// Pista fija (sin saltos de layout) mientras carga la sección elegida.
function PistaCarga({ className }: { className: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute rounded-full bg-blue-400 shadow-[0_0_8px_rgb(96_165_250)] transition-opacity duration-150 ${pending ? "animate-pulse opacity-100" : "opacity-0"} ${className}`}
    />
  );
}

const activoEn = (ruta: string, href: string) => ruta === href || ruta.startsWith(`${href}/`);

// Cabina lateral: riel de íconos en md, menú completo en lg.
export function Sidebar() {
  const ruta = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/[0.06] bg-cabina bg-[radial-gradient(140%_50%_at_0%_0%,rgb(36_80_230/0.16),transparent_60%),radial-gradient(120%_40%_at_100%_100%,rgb(229_50_62/0.06),transparent_60%)] md:flex md:w-20 lg:w-64">
      <Link
        href="/viajes"
        aria-label="TransVelsa, inicio"
        className="block rounded-none pt-3 pb-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-400"
      >
        {/* El logo es cuadrado con margen negro: se recorta para quitarlo. */}
        <Image
          src="/Transveliz.jpeg"
          alt="TransVelsa"
          width={1024}
          height={1024}
          sizes="(min-width: 1024px) 192px, 56px"
          loading="eager"
          className="mx-auto object-cover md:size-14 md:rounded-xl md:object-[50%_40%] lg:h-24 lg:w-48 lg:rounded-none lg:object-[50%_45%]"
        />
      </Link>
      <div className="franja-marca mx-4 h-px rounded-full opacity-80 lg:mx-5" />
      <p className="hidden px-6 pt-7 pb-2 text-eyebrow font-medium uppercase tracking-[0.14em] text-slate-500 lg:block">
        Operación
      </p>
      <nav aria-label="Principal" className="mt-4 flex flex-col gap-1 px-3 lg:mt-0">
        {enlaces.map((e) => {
          const activo = activoEn(ruta, e.href);
          return (
            <Link
              key={e.href}
              href={e.href}
              aria-current={activo ? "page" : undefined}
              title={e.texto}
              className="group relative flex items-center rounded-[10px] font-medium text-slate-400 transition-colors duration-150 hover:bg-white/[0.05] hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-inset aria-[current=page]:bg-white/[0.07] aria-[current=page]:text-white aria-[current=page]:shadow-[inset_0_1px_0_rgb(255_255_255/0.07),0_1px_2px_rgb(0_0_0/0.4)] aria-[current=page]:ring-1 aria-[current=page]:ring-white/[0.08] aria-[current=page]:ring-inset md:h-16 md:flex-col md:justify-center md:gap-1 md:px-1 md:text-[10px] lg:h-10 lg:flex-row lg:justify-start lg:gap-3 lg:px-2.5 lg:text-[13.5px]"
            >
              {activo && (
                <span aria-hidden className="absolute top-3 bottom-3 -left-3 w-0.5 rounded-r-full bg-blue-400 shadow-[0_0_12px_rgb(96_165_250/0.9)]" />
              )}
              <span className="grid size-8 place-items-center rounded-lg transition-colors group-aria-[current=page]:bg-linear-to-b group-aria-[current=page]:from-blue-500 group-aria-[current=page]:to-marca group-aria-[current=page]:text-white group-aria-[current=page]:shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_4px_14px_-4px_rgb(36_80_230/0.9)] lg:size-6.5 lg:rounded-md">
                <Icono nombre={e.icono} className="size-[18px] lg:size-[15px]" />
              </span>
              <span className="lg:hidden">{e.corto}</span>
              <span className="hidden lg:inline">{e.texto}</span>
              <Icono
                nombre="chevronDer"
                className="ml-auto hidden size-4 text-slate-600 opacity-0 transition group-hover:opacity-100 group-aria-[current=page]:opacity-0 lg:block"
              />
              <PistaCarga className="inset-x-3 bottom-1 h-0.5" />
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-3">
        <div className="relative isolate overflow-hidden rounded-2xl bg-white/[0.03] p-3 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] ring-1 ring-white/[0.07] md:flex md:justify-center lg:block lg:p-3.5">
          <div aria-hidden className="franjas-diagonales absolute inset-y-0 right-0 -z-10 hidden w-2/3 opacity-60 lg:block" />
          <Icono nombre="camion" className="size-5 shrink-0 text-blue-400 lg:hidden" />
          <div className="hidden lg:block">
            <p className="flex items-center gap-2 text-[13px] font-semibold tracking-tight text-white">
              <span aria-hidden className="relative grid size-2 place-items-center">
                <span className="absolute size-2 rounded-full bg-emerald-400/40 motion-safe:animate-ping" />
                <span className="size-1.5 rounded-full bg-emerald-400" />
              </span>
              TransVelsa
            </p>
            <p className="mt-0.5 text-xs leading-snug text-slate-400">Transporte de carga · Guatemala</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Compatibilidad con el nombre anterior.
export const Navegacion = Sidebar;

// Encabezado compacto tipo app (solo celular): logo + sección actual.
export function EncabezadoMovil() {
  const ruta = usePathname();
  const actual = enlaces.find((e) => activoEn(ruta, e.href));
  return (
    <header className="vidrio-oscuro sticky top-0 z-20 border-b border-white/[0.06] pt-[env(safe-area-inset-top)] md:hidden">
      <div className="flex h-14 items-center gap-3 px-4">
        <Link
          href="/viajes"
          aria-label="TransVelsa, inicio"
          className="-ml-1 shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        >
          {/* El logo es cuadrado con fondo negro: se recorta a 2:1 para quitar el margen. */}
          <Image
            src="/Transveliz.jpeg"
            alt="TransVelsa"
            width={1024}
            height={1024}
            sizes="88px"
            loading="eager"
            className="h-11 w-[88px] object-cover object-[50%_45%]"
          />
        </Link>
        {actual && (
          <>
            <span aria-hidden className="h-6 w-px bg-white/15" />
            <p className="flex min-w-0 items-center gap-2 font-display text-[16px] font-semibold tracking-tight text-white">
              <Icono nombre={actual.icono} className="size-4 shrink-0 text-blue-400" />
              <span className="truncate">{actual.texto}</span>
            </p>
          </>
        )}
      </div>
      <div className="franja-marca h-px opacity-80" />
    </header>
  );
}

// Barra inferior tipo app, solo en celular.
export function NavegacionMovil() {
  const ruta = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="vidrio-oscuro fixed inset-x-3 bottom-[calc(0.625rem+env(safe-area-inset-bottom))] z-30 overflow-hidden rounded-[22px] shadow-flotante ring-1 ring-white/10 md:hidden"
    >
      <div className="grid h-16 grid-cols-5 px-1">
        {enlaces.map((e) => {
          const activo = activoEn(ruta, e.href);
          return (
            <Link
              key={e.href}
              href={e.href}
              aria-current={activo ? "page" : undefined}
              className="group relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-inset active:text-white aria-[current=page]:font-semibold aria-[current=page]:text-white"
            >
              {activo && (
                <span aria-hidden className="absolute top-0 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-b-full bg-blue-400 shadow-[0_0_12px_rgb(96_165_250)]" />
              )}
              <span className="grid h-8 w-14 place-items-center rounded-full transition-[background-color,transform] duration-150 group-active:scale-90 group-aria-[current=page]:bg-white/[0.1] group-aria-[current=page]:shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] group-aria-[current=page]:ring-1 group-aria-[current=page]:ring-white/10">
                <Icono nombre={e.icono} className="size-5" grosor={activo ? 2 : 1.75} />
              </span>
              <span className="max-w-full truncate px-0.5">{e.corto}</span>
              <PistaCarga className="bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
