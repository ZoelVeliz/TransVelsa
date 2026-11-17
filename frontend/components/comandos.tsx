"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { cerrarSesion } from "@/app/login/acciones";
import { abrirComandos, EVENTO_ABRIR_COMANDOS } from "./eventos";
import { Icono, type NombreIcono } from "./iconos";
import { enlaces, enlaceUsuarios } from "./navegacion";

/**
 * Paleta de comandos (Ctrl+K / ⌘K): saltar a una sección o a una acción
 * frecuente sin buscarla en el menú. <dialog> nativo: atrapa el foco, cierra
 * con Esc y devuelve el foco al botón que la abrió.
 */

type Comando = {
  id: string;
  texto: string;
  grupo: "Ir a" | "Acciones" | "Cuenta";
  icono: NombreIcono;
  /** Palabras extra para encontrarlo ("diesel" encuentra Gastos). */
  claves?: string;
  href?: string;
  /** Descarga o recurso que no es una página de la app. */
  externo?: boolean;
  accion?: "salir";
};

const COMANDOS: Comando[] = [
  ...[...enlaces, enlaceUsuarios].map((e) => ({
    id: `ir${e.href}`,
    texto: e.texto,
    grupo: "Ir a" as const,
    icono: e.icono,
    href: e.href,
    claves: e.corto,
  })),
  { id: "nuevo-viaje", texto: "Nuevo viaje", grupo: "Acciones", icono: "camion", href: "/viajes#nuevo-viaje", claves: "crear agregar pedido" },
  { id: "nuevo-gasto", texto: "Registrar gasto", grupo: "Acciones", icono: "bomba", href: "/gastos#nuevo-gasto", claves: "diesel repuesto combustible" },
  { id: "nuevo-movimiento", texto: "Nuevo movimiento de caja", grupo: "Acciones", icono: "billetera", href: "/movimientos#nuevo-movimiento", claves: "ingreso egreso transferencia dinero" },
  { id: "excel", texto: "Descargar reporte en Excel", grupo: "Acciones", icono: "descargar", href: "/reportes/excel", externo: true, claves: "xlsx exportar" },
  { id: "cuenta", texto: "Mi cuenta y contraseña", grupo: "Cuenta", icono: "usuario", href: "/usuarios", claves: "perfil password" },
  { id: "salir", texto: "Cerrar sesión", grupo: "Cuenta", icono: "salir", accion: "salir", claves: "salir logout" },
];

// Sin acentos ni mayúsculas: "diesel" encuentra "Diésel".
const normalizar = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function PaletaComandos() {
  const router = useRouter();
  const dialogo = useRef<HTMLDialogElement>(null);
  const [consulta, setConsulta] = useState("");
  const [activo, setActivo] = useState(0);
  const [, iniciar] = useTransition();
  const idLista = useId();

  const resultados = useMemo(() => {
    const q = normalizar(consulta.trim());
    if (!q) return COMANDOS;
    const palabras = q.split(/\s+/);
    return COMANDOS.filter((c) => {
      const texto = normalizar(`${c.texto} ${c.claves ?? ""} ${c.grupo}`);
      return palabras.every((p) => texto.includes(p));
    });
  }, [consulta]);

  useEffect(() => {
    const abrir = () => {
      const d = dialogo.current;
      if (!d || d.open) return;
      setConsulta("");
      setActivo(0);
      d.showModal();
    };
    const teclado = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialogo.current?.open) dialogo.current.close();
        else abrir();
      }
    };
    window.addEventListener(EVENTO_ABRIR_COMANDOS, abrir);
    window.addEventListener("keydown", teclado);
    return () => {
      window.removeEventListener(EVENTO_ABRIR_COMANDOS, abrir);
      window.removeEventListener("keydown", teclado);
    };
  }, []);

  const ejecutar = (c: Comando | undefined) => {
    if (!c) return;
    dialogo.current?.close();
    if (c.accion === "salir") {
      iniciar(() => cerrarSesion());
    } else if (c.externo && c.href) {
      window.location.href = c.href;
    } else if (c.href) {
      router.push(c.href);
    }
  };

  const mover = (delta: number) => {
    if (resultados.length === 0) return;
    setActivo((a) => (a + delta + resultados.length) % resultados.length);
  };

  const grupos = ["Ir a", "Acciones", "Cuenta"] as const;
  let indice = -1;

  return (
    <dialog
      ref={dialogo}
      aria-label="Buscar secciones y acciones"
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="paleta m-0 mx-auto mt-[min(18vh,9rem)] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl bg-white/90 p-0 text-tinta shadow-[0_0_0_1px_rgb(17_24_39/0.08),0_30px_80px_-20px_rgb(17_24_39/0.45)] backdrop-blur-2xl open:animate-aparecer"
    >
      <div className="flex items-center gap-3 border-b border-borde px-4">
        <Icono nombre="buscar" className="size-4.5 shrink-0 text-suave" />
        <input
          autoFocus
          value={consulta}
          onChange={(e) => {
            setConsulta(e.target.value);
            setActivo(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              mover(1);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              mover(-1);
            } else if (e.key === "Enter") {
              e.preventDefault();
              ejecutar(resultados[activo]);
            }
          }}
          role="combobox"
          aria-expanded="true"
          aria-controls={idLista}
          aria-activedescendant={resultados[activo] ? `${idLista}-${resultados[activo].id}` : undefined}
          aria-autocomplete="list"
          placeholder="Buscar sección o acción…"
          className="h-14 min-w-0 flex-1 bg-transparent text-base text-tinta outline-none placeholder:text-suave"
        />
        <kbd className="hidden rounded-md bg-slate-900/[0.05] px-1.5 py-0.5 font-sans text-[11px] font-medium text-suave ring-1 ring-borde sm:block">
          Esc
        </kbd>
      </div>

      <ul id={idLista} role="listbox" aria-label="Resultados" className="max-h-[min(60vh,24rem)] overflow-y-auto p-2 scrollbar-thin">
        {resultados.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-tenue">Nada coincide con “{consulta}”.</li>
        )}
        {grupos.map((g) => {
          const items = resultados.filter((c) => c.grupo === g);
          if (items.length === 0) return null;
          return (
            <li key={g} role="presentation">
              <p className="px-3 pt-2.5 pb-1.5 text-eyebrow font-medium tracking-[0.08em] text-suave uppercase">{g}</p>
              <ul role="presentation">
                {items.map((c) => {
                  indice += 1;
                  const i = indice;
                  const sel = i === activo;
                  return (
                    <li
                      key={c.id}
                      id={`${idLista}-${c.id}`}
                      role="option"
                      aria-selected={sel}
                      onMouseMove={() => !sel && setActivo(i)}
                      onClick={() => ejecutar(c)}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-tinta transition-colors aria-selected:bg-marca aria-selected:text-white"
                    >
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-lg ring-1 transition-colors ${sel ? "bg-white/15 ring-white/20" : "bg-white ring-borde"}`}
                      >
                        <Icono nombre={c.icono} className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{c.texto}</span>
                      {sel && <Icono nombre="chevronDer" className="size-4 shrink-0 opacity-80" />}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-4 border-t border-borde bg-white/50 px-4 py-2.5 text-xs text-suave max-sm:hidden">
        <span className="flex items-center gap-1.5">
          <Tecla>↑</Tecla>
          <Tecla>↓</Tecla> moverse
        </span>
        <span className="flex items-center gap-1.5">
          <Tecla>Enter</Tecla> abrir
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <Tecla>Ctrl</Tecla>
          <Tecla>K</Tecla> abrir o cerrar
        </span>
      </div>
    </dialog>
  );
}

function Tecla({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-grid min-w-5 place-items-center rounded-md bg-white px-1 py-0.5 font-sans text-[11px] font-medium text-tenue shadow-[0_1px_0_rgb(17_24_39/0.1)] ring-1 ring-borde">
      {children}
    </kbd>
  );
}

/** Botón tipo buscador que abre la paleta (barra superior de escritorio). */
export function BotonComandos({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={abrirComandos}
      aria-keyshortcuts="Control+K Meta+K"
      className={`group flex h-9 items-center gap-2.5 rounded-xl bg-white/70 pr-2 pl-3 text-sm text-suave shadow-[inset_0_1px_0_white,0_1px_2px_rgb(17_24_39/0.05)] ring-1 ring-borde transition-[background-color,box-shadow,color] hover:bg-white hover:text-tinta hover:ring-borde-fuerte focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca ${className}`}
    >
      <Icono nombre="buscar" className="size-4" />
      <span className="flex-1 text-left">Buscar o ir a…</span>
      <span className="flex gap-1" aria-hidden>
        <Tecla>Ctrl</Tecla>
        <Tecla>K</Tecla>
      </span>
    </button>
  );
}
