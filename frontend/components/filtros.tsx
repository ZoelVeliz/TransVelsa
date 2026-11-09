"use client";

import Form from "next/form";
import { useRouter } from "next/navigation";
import { createContext, useContext, useTransition, type FormEvent, type ReactNode } from "react";
import { Icono } from "./iconos";

// next/form navega sin transición, así que no hay forma de saber que está cargando.
// Aquí se arma la misma URL que un formulario GET nativo y se navega dentro de una
// transición: el botón muestra "Cargando…" y el plegable se cierra al terminar.
const CargandoFiltros = createContext(false);

export function useCargandoFiltros() {
  return useContext(CargandoFiltros);
}

export function FormFiltros({
  action,
  className,
  children,
}: {
  action: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [cargando, iniciar] = useTransition();

  function alEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const url = new URL(action, window.location.href);
    url.search = "";
    for (const [nombre, valor] of new FormData(e.currentTarget)) {
      url.searchParams.append(nombre, typeof valor === "string" ? valor : valor.name);
    }
    iniciar(() => router.push(`${url.pathname}${url.search}`));
  }

  return (
    <CargandoFiltros.Provider value={cargando}>
      <Form action={action} onSubmit={alEnviar} aria-busy={cargando} className={className}>
        {children}
      </Form>
    </CargandoFiltros.Provider>
  );
}

export function BotonFiltrar({ className, children }: { className: string; children: ReactNode }) {
  const cargando = useCargandoFiltros();
  return (
    <button type="submit" aria-disabled={cargando} className={`${className} aria-disabled:cursor-wait`}>
      {/* Mismo tamaño en ambos estados: el ícono se cambia por el giro. */}
      {cargando ? (
        <span aria-hidden className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : (
        <Icono nombre="filtro" />
      )}
      <span className="grid">
        <span className={`col-start-1 row-start-1 ${cargando ? "invisible" : ""}`}>{children}</span>
        <span className={`col-start-1 row-start-1 ${cargando ? "" : "invisible"}`}>Cargando…</span>
      </span>
    </button>
  );
}
