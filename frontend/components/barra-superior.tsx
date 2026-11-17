"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cerrarSesion } from "@/app/login/acciones";
import { BotonComandos } from "./comandos";
import { Icono } from "./iconos";
import { activoEn, enlaces, enlaceUsuarios } from "./navegacion";

/** Barra superior de escritorio: dónde estás, buscador (Ctrl+K) y tu cuenta. */
export function BarraSuperior({ usuario }: { usuario: ReactNode }) {
  const ruta = usePathname();
  const actual = [...enlaces, enlaceUsuarios].find((e) => activoEn(ruta, e.href));
  return (
    <div className="vidrio sticky top-0 z-20 hidden border-b border-borde md:block">
      <div className="mx-auto flex h-15 w-full max-w-[1440px] items-center gap-4 px-6 lg:px-10 xl:px-12">
        <nav aria-label="Ruta" className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-2 text-sm">
            <li className="shrink-0 font-medium text-suave">
              <Link href="/viajes" className="rounded-md transition-colors hover:text-tinta">
                TransVelsa
              </Link>
            </li>
            {actual && (
              <>
                <li aria-hidden className="text-borde-fuerte">
                  /
                </li>
                <li className="flex min-w-0 items-center gap-2 font-semibold text-tinta" aria-current="page">
                  <Icono nombre={actual.icono} className="size-4 shrink-0 text-marca" />
                  <span className="truncate">{actual.texto}</span>
                </li>
              </>
            )}
          </ol>
        </nav>
        <BotonComandos className="w-64 lg:w-72" />
        {usuario}
      </div>
    </div>
  );
}

const iniciales = (nombre: string) =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

/** Chip con la cuenta actual y su menú (Mi cuenta, Cerrar sesión). */
export function MenuUsuario({ nombre, usuario, esAdmin }: { nombre: string; usuario: string; esAdmin: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false);
        boton.current?.focus();
      }
    };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  const claseItem =
    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-tinta transition-colors hover:bg-slate-900/[0.05] focus-visible:bg-slate-900/[0.05] focus-visible:outline-none";

  return (
    <div ref={caja} className="relative shrink-0">
      <button
        ref={boton}
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-label={`Cuenta de ${nombre}`}
        className="flex h-9 items-center gap-2 rounded-full bg-white/70 py-1 pr-2.5 pl-1 shadow-[inset_0_1px_0_white,0_1px_2px_rgb(17_24_39/0.05)] ring-1 ring-borde transition-colors hover:bg-white hover:ring-borde-fuerte focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca aria-expanded:bg-white"
      >
        <span
          aria-hidden
          className="grid size-7 place-items-center rounded-full bg-linear-to-br from-marca to-violet-600 text-[11px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3)]"
        >
          {iniciales(nombre)}
        </span>
        <span className="max-w-32 truncate text-sm font-medium text-tinta max-lg:hidden">{nombre.split(" ")[0]}</span>
        <Icono nombre="chevron" className="size-3.5 text-suave" />
      </button>

      {abierto && (
        <div
          role="menu"
          aria-label="Cuenta"
          className="absolute top-full right-0 z-30 mt-2 w-64 origin-top-right rounded-2xl bg-white/95 p-1.5 shadow-[0_0_0_1px_rgb(17_24_39/0.08),0_20px_50px_-12px_rgb(17_24_39/0.35)] backdrop-blur-xl animate-aparecer"
        >
          <div className="px-2.5 pt-2 pb-2.5">
            <p className="truncate text-sm font-semibold text-tinta">{nombre}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-tenue">
              <span className="truncate font-mono">@{usuario}</span>
              {esAdmin && (
                <span className="rounded-full bg-marca-50 px-1.5 py-px text-[10px] font-semibold text-marca-oscuro ring-1 ring-marca/20">
                  Admin
                </span>
              )}
            </p>
          </div>
          <div className="my-1 h-px bg-borde" />
          <Link role="menuitem" href="/usuarios" onClick={() => setAbierto(false)} className={claseItem}>
            <Icono nombre="usuario" className="size-4 text-suave" />
            {esAdmin ? "Usuarios y mi cuenta" : "Mi cuenta"}
          </Link>
          <form action={cerrarSesion}>
            <button role="menuitem" className={`${claseItem} text-peligro`}>
              <Icono nombre="salir" className="size-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
