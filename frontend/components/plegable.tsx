"use client";

import { useState, type ReactNode } from "react";
import { Icono } from "./iconos";

// Solo celular: esconde los hijos tras un botón. En sm+ siempre visibles.
// `display: contents` deja que los hijos sigan en la grilla del formulario.
export function PlegableMovil({
  children,
  activos,
  etiqueta = "Filtros",
}: {
  children: ReactNode;
  activos?: boolean;
  etiqueta?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
        className="col-span-2 flex h-11 items-center gap-2 rounded-control bg-white px-3.5 text-sm font-semibold text-tinta shadow-control ring-1 ring-borde-fuerte ring-inset transition-colors active:bg-fondo sm:hidden"
      >
        <Icono nombre="filtro" className="size-4 text-tenue" />
        {etiqueta}
        {activos && (
          <span className="rounded-full bg-marca-50 px-2 py-0.5 text-xs font-semibold text-marca-oscuro ring-1 ring-marca/20 ring-inset">
            Aplicados
          </span>
        )}
        <Icono
          nombre="chevron"
          className={`ml-auto size-4 text-tenue transition-transform ${abierto ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`${abierto ? "contents" : "hidden"} sm:contents`}>{children}</div>
    </>
  );
}
