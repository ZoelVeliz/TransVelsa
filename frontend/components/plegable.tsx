"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useCargandoFiltros } from "./filtros";
import { Icono } from "./iconos";

// Texto corto de cada campo con valor (lo que el usuario ve en el control).
function leerResumen(panel: HTMLElement | null): string[] {
  if (!panel) return [];
  const out: string[] = [];
  for (const el of panel.querySelectorAll<HTMLInputElement | HTMLSelectElement>("select[name], input[name]")) {
    if (el instanceof HTMLInputElement && (el.type === "hidden" || el.type === "submit")) continue;
    const v = el.value.trim();
    if (!v) continue;
    let texto = v;
    if (el instanceof HTMLSelectElement) texto = el.selectedOptions[0]?.text.trim() || v;
    else if (el.type === "date") {
      const [a, m, d] = v.split("-");
      texto = `${d}/${m}/${a}`;
    }
    // "Semana desde" + "Semana 45" -> "Semana desde 45".
    const etiqueta = el.closest("label")?.querySelector("span")?.textContent?.trim() ?? "";
    const primera = (t: string) => t.split(/\s+/)[0]?.toLowerCase();
    if (etiqueta && primera(texto) === primera(etiqueta)) texto = texto.split(/\s+/).slice(1).join(" ");
    out.push(etiqueta ? `${etiqueta}: ${texto}` : texto);
  }
  return out;
}

// Solo celular: esconde los hijos tras un botón. En sm+ siempre visibles.
// `display: contents` deja que los hijos sigan en la grilla del formulario.
// Cerrado, muestra un resumen de los filtros aplicados para no tener que abrirlo.
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
  const [resumen, setResumen] = useState<string[]>([]);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const cargando = useCargandoFiltros();
  const [cargabaAntes, setCargabaAntes] = useState(cargando);

  // Al terminar de cargar los filtros se cierra, para que los resultados queden a la vista.
  if (cargando !== cargabaAntes) {
    setCargabaAntes(cargando);
    if (!cargando) setAbierto(false);
  }

  // Se lee del DOM tras montar (los valores vienen de la URL); solo cambia si difiere.
  useEffect(() => {
    const nuevo = activos ? leerResumen(panel.current) : [];
    setResumen((r) => (r.join("|") === nuevo.join("|") ? r : nuevo));
  }, [activos, children]);

  return (
    <>
      <div className="col-span-2 flex flex-col gap-2 sm:hidden">
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls={id}
          onClick={() => setAbierto((a) => !a)}
          className="flex h-11 w-full items-center gap-2 rounded-control bg-white px-3.5 text-sm font-semibold text-tinta shadow-control ring-1 ring-borde-fuerte ring-inset transition-colors hover:bg-fondo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca active:bg-fondo-2 aria-expanded:ring-marca/40"
        >
          <Icono nombre="filtro" className={`size-4 ${activos ? "text-marca" : "text-tenue"}`} />
          {etiqueta}
          {activos && (
            <span className="rounded-full bg-marca-50 px-2 py-0.5 text-xs font-semibold text-marca-oscuro ring-1 ring-marca/20 ring-inset">
              {resumen.length > 0 ? `${resumen.length} aplicado${resumen.length === 1 ? "" : "s"}` : "Aplicados"}
            </span>
          )}
          <span className="ml-auto text-xs font-medium text-tenue">{abierto ? "Ocultar" : "Mostrar"}</span>
          <Icono
            nombre="chevron"
            className={`size-4 text-tenue transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}
          />
        </button>
        {!abierto && resumen.length > 0 && (
          <ul aria-label="Filtros aplicados" className="flex flex-wrap gap-1.5">
            {resumen.map((t, i) => (
              <li
                key={`${t}-${i}`}
                className="max-w-full truncate rounded-full bg-fondo-2 px-2.5 py-1 text-xs font-medium text-tinta ring-1 ring-borde ring-inset"
              >
                {t.includes(": ") ? (
                  <>
                    <span className="text-tenue">{t.slice(0, t.indexOf(": "))}</span> {t.slice(t.indexOf(": ") + 2)}
                  </>
                ) : (
                  t
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div id={id} ref={panel} className={`${abierto ? "contents" : "hidden"} sm:contents`}>
        {children}
      </div>
    </>
  );
}
