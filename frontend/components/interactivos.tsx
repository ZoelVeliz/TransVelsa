"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { Estado } from "@/lib/acciones";
import { ESTATUS_VIAJE } from "@/lib/constantes";
import { ESTILO_ESTATUS, PUNTO_ESTATUS } from "./estatus";
import { Icono, type NombreIcono } from "./iconos";
import { claseBotonIcono, claseBotonPrimario } from "./ui";

// Formulario de alta: muestra el error del servidor y solo se limpia si se guardó bien.
export function Formulario({
  accion,
  children,
  textoBoton = "Agregar",
  icono = "mas",
}: {
  accion: (estado: Estado, form: FormData) => Promise<Estado>;
  children: ReactNode;
  textoBoton?: string;
  icono?: NombreIcono;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, {});
  const [guardado, setGuardado] = useState(false);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) {
      ref.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- aviso temporal tras guardar
      setGuardado(true);
      const t = setTimeout(() => setGuardado(false), 2500);
      return () => clearTimeout(t);
    }
  }, [estado]);

  return (
    <form
      ref={ref}
      onSubmit={(e) => {
        e.preventDefault();
        const datos = new FormData(e.currentTarget);
        startTransition(() => enviar(datos));
      }}
      className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end"
    >
      {children}
      <button disabled={pendiente} className={`${claseBotonPrimario} max-sm:col-span-2`}>
        {pendiente ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Guardando…
          </>
        ) : (
          <>
            <Icono nombre={icono} />
            {textoBoton}
          </>
        )}
      </button>
      {guardado && !pendiente && (
        <p
          role="status"
          className="col-span-2 flex items-center gap-1.5 text-sm font-medium text-exito animate-entrada sm:self-center"
        >
          <Icono nombre="check" className="size-4" />
          Guardado
        </p>
      )}
      {estado.error && (
        <p
          role="alert"
          className="col-span-2 flex w-full items-center gap-2 rounded-control bg-acento-claro px-3 py-2 text-sm font-medium text-acento-oscuro ring-1 ring-acento/20 ring-inset"
        >
          <Icono nombre="alerta" className="size-4 shrink-0" />
          {estado.error}
        </p>
      )}
    </form>
  );
}

// En táctil se ve siempre; en escritorio se aclara con el hover de la fila (claseFila lleva `group`).
export function BotonBorrar({
  accion,
  pregunta = "¿Borrar este registro?",
}: {
  accion: () => Promise<void>;
  pregunta?: string;
}) {
  const [pendiente, iniciar] = useTransition();
  return (
    <button
      type="button"
      disabled={pendiente}
      aria-label="Borrar"
      title="Borrar"
      onClick={() => {
        if (confirm(pregunta)) iniciar(accion);
      }}
      className={`${claseBotonIcono} focus-visible:opacity-100 [@media(hover:hover)]:md:opacity-40 [@media(hover:hover)]:md:group-hover:opacity-100`}
    >
      {pendiente ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : (
        <Icono nombre="basura" className="size-4" />
      )}
    </button>
  );
}

export function SelectEstatus({
  estatus,
  accion,
}: {
  estatus: (typeof ESTATUS_VIAJE)[number];
  accion: (estatus: string) => Promise<void>;
}) {
  const [pendiente, iniciar] = useTransition();
  return (
    <span className="relative inline-flex items-center">
      {pendiente ? (
        <span className="pointer-events-none absolute left-2 size-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : (
        <span className={`pointer-events-none absolute left-2.5 size-1.5 rounded-full ${PUNTO_ESTATUS[estatus]}`} />
      )}
      <select
        aria-label="Estatus"
        aria-busy={pendiente}
        value={estatus}
        disabled={pendiente}
        onChange={(e) => {
          const nuevo = e.target.value;
          iniciar(() => accion(nuevo));
        }}
        className={`h-7 cursor-pointer appearance-none rounded-full bg-none py-0 pr-6 pl-6 text-xs font-semibold ring-1 ring-inset transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca disabled:cursor-wait disabled:opacity-60 max-md:h-10 max-md:pr-7 max-md:pl-7 max-md:text-base ${ESTILO_ESTATUS[estatus]}`}
      >
        {ESTATUS_VIAJE.map((e) => (
          <option key={e}>{e}</option>
        ))}
      </select>
      <Icono nombre="chevron" className="pointer-events-none absolute right-2 size-3 opacity-60" grosor={2.5} />
    </span>
  );
}

export function MontoEditable({
  monto,
  accion,
  etiqueta = "Monto en quetzales",
}: {
  monto: number;
  accion: (monto: number) => Promise<void>;
  etiqueta?: string;
}) {
  const [pendiente, iniciar] = useTransition();
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (!guardado) return;
    const t = setTimeout(() => setGuardado(false), 1000);
    return () => clearTimeout(t);
  }, [guardado]);

  return (
    <span className="relative inline-flex items-center">
      <span className="pointer-events-none absolute left-2.5 text-sm text-tenue">Q</span>
      <input
        type="number"
        step="0.01"
        min="0"
        aria-label={etiqueta}
        defaultValue={monto}
        disabled={pendiente}
        onBlur={(e) => {
          const nuevo = Number(e.target.value);
          if (nuevo !== monto)
            iniciar(async () => {
              await accion(nuevo);
              setGuardado(true);
            });
        }}
        className={`h-9 w-32 rounded-control border bg-white pr-2.5 pl-7 text-right text-base tabular-nums transition hover:border-slate-400 focus:border-marca focus:outline-none focus:ring-4 focus:ring-marca/15 disabled:opacity-60 sm:text-sm ${guardado ? "border-exito ring-2 ring-exito/40" : "border-borde-fuerte"}`}
      />
    </span>
  );
}
