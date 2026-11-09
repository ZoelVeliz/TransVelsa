"use client";

import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Icono, type NombreIcono } from "./iconos";

const enlaces: { href: string; texto: string; corto: string; icono: NombreIcono }[] = [
  { href: "/viajes", texto: "Viajes", corto: "Viajes", icono: "camion" },
  { href: "/gastos", texto: "Diésel y gastos", corto: "Gastos", icono: "bomba" },
  { href: "/movimientos", texto: "Caja y cuentas", corto: "Caja", icono: "billetera" },
  { href: "/choferes", texto: "Tarifario y choferes", corto: "Choferes", icono: "usuarios" },
  { href: "/reportes", texto: "Reportes", corto: "Reportes", icono: "grafica" },
];

// Pista fija (sin saltos de layout) mientras carga la sección elegida.
function PistaCarga({ className }: { className: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute rounded-full bg-blue-400 transition-opacity duration-150 ${pending ? "animate-pulse opacity-100" : "opacity-0"} ${className}`}
    />
  );
}

const activoEn = (ruta: string, href: string) => ruta === href || ruta.startsWith(`${href}/`);

// Cabina lateral: riel de íconos en md, menú completo en lg.
export function Sidebar() {
  const ruta = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/6 bg-cabina md:flex md:w-20 lg:w-64">
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
      <div className="franja-marca mx-4 h-0.75 rounded-full lg:mx-5" />
      <p className="hidden px-6 pt-7 pb-2 text-eyebrow font-semibold uppercase tracking-[0.18em] text-slate-500 lg:block">
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
              className="group relative flex items-center rounded-control font-medium text-slate-400 transition-colors duration-150 hover:bg-cabina-3 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-inset aria-[current=page]:bg-linear-to-r aria-[current=page]:from-white/9 aria-[current=page]:to-white/3 aria-[current=page]:text-white aria-[current=page]:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] aria-[current=page]:ring-1 aria-[current=page]:ring-white/7 aria-[current=page]:ring-inset md:h-16 md:flex-col md:justify-center md:gap-1 md:px-1 md:text-[10px] lg:h-11 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm"
            >
              {activo && (
                <span aria-hidden className="absolute top-2.5 bottom-2.5 left-0 w-0.75 rounded-r-full bg-acento shadow-[0_0_10px_rgb(225_29_42/0.7)]" />
              )}
              <span className="grid size-8 place-items-center rounded-lg transition-colors group-aria-[current=page]:bg-marca group-aria-[current=page]:text-white group-aria-[current=page]:shadow-[0_4px_12px_-4px_rgb(29_78_216/0.9)] lg:size-7">
                <Icono nombre={e.icono} className="size-[18px] lg:size-4" />
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
        <div className="relative isolate overflow-hidden rounded-tarjeta bg-cabina-2 p-3 ring-1 ring-white/7 md:flex md:justify-center lg:block">
          <div aria-hidden className="franjas-diagonales absolute inset-y-0 right-0 -z-10 hidden w-1/2 opacity-25 lg:block" />
          <Icono nombre="camion" className="size-5 shrink-0 text-blue-400 lg:hidden" />
          <div className="hidden lg:block">
            <p className="font-display text-sm font-extrabold tracking-wide text-plata uppercase italic">TransVelsa</p>
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
    <header className="sticky top-0 z-20 bg-cabina/95 pt-[env(safe-area-inset-top)] backdrop-blur-md md:hidden">
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
            <p className="flex min-w-0 items-center gap-2 font-display text-[17px] font-semibold tracking-wide text-white">
              <Icono nombre={actual.icono} className="size-4 shrink-0 text-blue-400" />
              <span className="truncate">{actual.texto}</span>
            </p>
          </>
        )}
      </div>
      <div className="franja-marca h-0.5" />
    </header>
  );
}

// Barra inferior tipo app, solo en celular.
export function NavegacionMovil() {
  const ruta = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/8 bg-cabina/95 pb-[env(safe-area-inset-bottom)] shadow-flotante backdrop-blur-md md:hidden"
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
                <span aria-hidden className="absolute top-0 left-1/2 h-0.75 w-8 -translate-x-1/2 rounded-b-full bg-acento shadow-[0_0_10px_rgb(225_29_42/0.8)]" />
              )}
              <span className="grid h-8 w-14 place-items-center rounded-full transition-[background-color,transform] duration-150 group-active:scale-90 group-aria-[current=page]:bg-marca group-aria-[current=page]:shadow-[0_6px_16px_-6px_rgb(29_78_216/0.95)]">
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
