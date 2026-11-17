"use client";

import { startTransition, useActionState, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import type { EstadoUsuario } from "@/lib/acciones-usuarios";
import { Icono, type NombreIcono } from "./iconos";
import { claseBotonPrimario, claseBotonSecundario } from "./ui";

const ERROR_RED = "No se pudo guardar. Revisa tu conexión e intenta de nuevo.";

/** Mensaje de resultado. Si trae una contraseña temporal, se puede copiar. */
function Resultado({ estado, alCerrar }: { estado: EstadoUsuario; alCerrar?: () => void }) {
  const [copiado, setCopiado] = useState(false);
  if (estado.error) {
    return (
      <p
        role="alert"
        className="flex w-full items-start gap-2 rounded-control border-l-[3px] border-l-acento bg-acento-claro/70 px-3 py-2.5 text-sm font-medium text-red-800 ring-1 ring-acento/20 ring-inset animate-aparecer"
      >
        <Icono nombre="alerta" className="mt-0.5 size-4 shrink-0" />
        <span className="min-w-0 flex-1">{estado.error}</span>
        {alCerrar && (
          <button type="button" onClick={alCerrar} aria-label="Cerrar" className="-my-1 grid size-7 place-items-center rounded-md hover:bg-white/60">
            <Icono nombre="equis" className="size-3.5" />
          </button>
        )}
      </p>
    );
  }
  if (!estado.mensaje) return null;
  const { temporal } = estado;
  return (
    <div
      role="status"
      className="w-full rounded-control border-l-[3px] border-l-exito bg-exito-claro/60 px-3 py-2.5 text-sm text-green-900 ring-1 ring-green-600/20 ring-inset animate-aparecer"
    >
      <div className="flex items-start gap-2">
        <Icono nombre="checkCirculo" className="mt-0.5 size-4 shrink-0" />
        <span className="min-w-0 flex-1 wrap-break-word">{estado.mensaje}</span>
        {alCerrar && (
          <button type="button" onClick={alCerrar} aria-label="Cerrar" className="-my-1 grid size-7 shrink-0 place-items-center rounded-md hover:bg-white/60">
            <Icono nombre="equis" className="size-3.5" />
          </button>
        )}
      </div>
      {temporal && (
        <div className="mt-2 flex flex-wrap items-center gap-2 pl-6">
          <code className="rounded-md bg-white/90 px-2.5 py-1 font-mono text-[15px] font-semibold tracking-wider text-tinta ring-1 ring-green-600/20">
            {temporal}
          </code>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(temporal);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              } catch {}
            }}
            className={`${claseBotonSecundario} h-8! px-2.5! text-xs`}
          >
            <Icono nombre={copiado ? "check" : "copiar"} />
            {copiado ? "Copiada" : "Copiar"}
          </button>
        </div>
      )}
    </div>
  );
}

function FormularioConResultado({
  accion,
  children,
  textoBoton,
  icono,
  className,
}: {
  accion: (e: EstadoUsuario, f: FormData) => Promise<EstadoUsuario>;
  children: ReactNode;
  textoBoton: string;
  icono: NombreIcono;
  className: string;
}) {
  const [estado, enviar, pendiente] = useActionState(async (previo: EstadoUsuario, form: FormData) => {
    try {
      return await accion(previo, form);
    } catch {
      return { error: ERROR_RED };
    }
  }, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.ok) ref.current?.reset();
  }, [estado]);
  return (
    <form
      ref={ref}
      aria-busy={pendiente}
      onSubmit={(e) => {
        e.preventDefault();
        if (pendiente) return;
        const datos = new FormData(e.currentTarget);
        startTransition(() => enviar(datos));
      }}
      className={className}
    >
      {children}
      <button disabled={pendiente} className={`${claseBotonPrimario} disabled:cursor-wait max-sm:col-span-2`}>
        <Icono nombre={pendiente ? "recargar" : icono} className={pendiente ? "animate-spin" : ""} />
        {pendiente ? "Guardando…" : textoBoton}
      </button>
      {!pendiente && (estado.error || estado.mensaje) && (
        <div className="col-span-full w-full basis-full">
          <Resultado estado={estado} />
        </div>
      )}
    </form>
  );
}

export function FormularioNuevoUsuario({
  accion,
  children,
}: {
  accion: (e: EstadoUsuario, f: FormData) => Promise<EstadoUsuario>;
  children: ReactNode;
}) {
  return (
    <FormularioConResultado
      accion={accion}
      textoBoton="Crear cuenta"
      icono="mas"
      className="grid grid-cols-2 gap-x-2.5 gap-y-3 sm:flex sm:flex-wrap sm:items-end sm:gap-3"
    >
      {children}
    </FormularioConResultado>
  );
}

export function FormularioMiPassword({
  accion,
  children,
}: {
  accion: (e: EstadoUsuario, f: FormData) => Promise<EstadoUsuario>;
  children: ReactNode;
}) {
  return (
    <FormularioConResultado
      accion={accion}
      textoBoton="Cambiar contraseña"
      icono="candado"
      className="grid gap-3 sm:grid-cols-3 sm:items-end"
    >
      {children}
    </FormularioConResultado>
  );
}

type Accion = () => Promise<EstadoUsuario>;

/** Botones por fila: activar/desactivar, admin y restablecer contraseña. */
export function AccionesUsuario({
  nombre,
  activo,
  esAdmin,
  esYo,
  alternarActivo,
  alternarAdmin,
  restablecer,
}: {
  nombre: string;
  activo: boolean;
  esAdmin: boolean;
  esYo: boolean;
  alternarActivo: Accion;
  alternarAdmin: Accion;
  restablecer: Accion;
}) {
  const [pendiente, iniciar] = useTransition();
  const [cual, setCual] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoUsuario>({});

  const ejecutar = (clave: string, fn: Accion, pregunta?: string) => {
    if (pregunta && !confirm(pregunta)) return;
    setEstado({});
    setCual(clave);
    iniciar(async () => {
      try {
        const r = await fn();
        setEstado(r.error || r.mensaje ? r : {});
      } catch {
        setEstado({ error: ERROR_RED });
      }
    });
  };

  const boton = (clave: string, texto: string, icono: NombreIcono, fn: Accion, pregunta?: string, peligro?: boolean) => (
    <button
      type="button"
      disabled={pendiente}
      onClick={() => ejecutar(clave, fn, pregunta)}
      className={`${claseBotonSecundario} h-9! px-3! text-xs disabled:cursor-wait ${peligro ? "text-peligro! hover:ring-red-300!" : ""}`}
    >
      <Icono nombre={pendiente && cual === clave ? "recargar" : icono} className={pendiente && cual === clave ? "animate-spin" : ""} />
      {texto}
    </button>
  );

  if (esYo) return <p className="text-xs text-suave">Tu cuenta</p>;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 lg:justify-end">
        {activo
          ? boton("activo", "Desactivar", "candado", alternarActivo, `¿Desactivar la cuenta de ${nombre}? Se cerrarán sus sesiones abiertas.`, true)
          : boton("activo", "Activar", "checkCirculo", alternarActivo)}
        {esAdmin
          ? boton("admin", "Quitar admin", "usuario", alternarAdmin, `¿Quitarle a ${nombre} el rol de administrador?`)
          : boton("admin", "Hacer admin", "usuarios", alternarAdmin, `¿Hacer administrador a ${nombre}? Podrá crear y desactivar cuentas.`)}
        {boton(
          "reset",
          "Nueva contraseña",
          "recargar",
          restablecer,
          `¿Crear una contraseña temporal nueva para ${nombre}? La actual dejará de servir y se cerrarán sus sesiones.`,
        )}
      </div>
      {(estado.error || estado.mensaje) && <Resultado estado={estado} alCerrar={() => setEstado({})} />}
    </div>
  );
}
