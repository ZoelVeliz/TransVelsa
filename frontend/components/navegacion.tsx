"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icono, type NombreIcono } from "./iconos";

const enlaces: { href: string; texto: string; corto: string; icono: NombreIcono }[] = [
  { href: "/viajes", texto: "Viajes", corto: "Viajes", icono: "camion" },
  { href: "/gastos", texto: "Diésel y gastos", corto: "Gastos", icono: "bomba" },
  { href: "/choferes", texto: "Tarifario y choferes", corto: "Choferes", icono: "usuarios" },
  { href: "/reportes", texto: "Reportes", corto: "Reportes", icono: "grafica" },
];

// Cabina lateral: riel de íconos en md, menú completo en lg.
export function Sidebar() {
  const ruta = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden flex-col bg-cabina md:flex md:w-20 lg:w-64">
      <Link
        href="/viajes"
        aria-label="TransVelsa, inicio"
        className="block pt-3 pb-4 focus-visible:outline-2 focus-visible:outline-blue-400"
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
      <div className="franja-marca mx-3 h-[3px] rounded-full lg:mx-5" />
      <p className="hidden px-5 pt-6 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 lg:block">
        Operación
      </p>
      <nav aria-label="Principal" className="mt-4 flex flex-col gap-1 px-3 lg:mt-0">
        {enlaces.map((e) => {
          const activo = ruta.startsWith(e.href);
          return (
            <Link
              key={e.href}
              href={e.href}
              aria-current={activo ? "page" : undefined}
              title={e.texto}
              className="group relative flex items-center rounded-control font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 aria-[current=page]:bg-white/[0.07] aria-[current=page]:text-white aria-[current=page]:ring-1 aria-[current=page]:ring-white/[0.06] aria-[current=page]:ring-inset md:h-16 md:flex-col md:justify-center md:gap-1 md:px-1 md:text-[10px] lg:h-11 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm"
            >
              {activo && (
                <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full bg-acento" />
              )}
              <Icono nombre={e.icono} className="size-5 group-aria-[current=page]:text-blue-400" />
              <span className="lg:hidden">{e.corto}</span>
              <span className="hidden lg:inline">{e.texto}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto bg-linear-to-b from-cabina to-cabina-2 p-3">
        <div className="flex items-center gap-3 rounded-tarjeta bg-white/[0.04] p-3 ring-1 ring-white/[0.06] md:justify-center lg:justify-start">
          <Icono nombre="camion" className="size-5 shrink-0 text-blue-400" />
          <p className="hidden text-xs leading-snug text-slate-400 lg:block">
            <span className="block font-display text-sm font-extrabold tracking-wide text-plata uppercase italic">
              TransVelsa
            </span>
            Transporte de carga · Guatemala
          </p>
        </div>
      </div>
    </aside>
  );
}

// Compatibilidad con el nombre anterior.
export const Navegacion = Sidebar;

// Barra inferior tipo app, solo en celular.
export function NavegacionMovil() {
  const ruta = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 bg-cabina/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.6)] backdrop-blur-md md:hidden"
    >
      <div className="franja-marca h-0.5" />
      <div className="grid h-16 grid-cols-4">
        {enlaces.map((e) => {
          const activo = ruta.startsWith(e.href);
          return (
            <Link
              key={e.href}
              href={e.href}
              aria-current={activo ? "page" : undefined}
              className="group flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-slate-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-inset active:scale-95 aria-[current=page]:text-white"
            >
              <span className="grid h-7 w-12 place-items-center rounded-full transition group-aria-[current=page]:bg-acento group-aria-[current=page]:shadow-[0_4px_14px_-4px_rgb(225_29_42/0.8)]">
                <Icono nombre={e.icono} className="size-5" />
              </span>
              {e.corto}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
