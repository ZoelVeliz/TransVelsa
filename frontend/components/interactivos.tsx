"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { Estado } from "@/lib/acciones";
import { ESTATUS_ASIGNADO, ESTATUS_VIAJE } from "@/lib/constantes";
import { ESTILO_ESTATUS, PUNTO_ESTATUS } from "./estatus";
import { Icono, type NombreIcono } from "./iconos";
import {
  claseBotonIcono,
  claseBotonPeligro,
  claseBotonPrimario,
  claseBotonSecundario,
  claseInput,
  Insignia,
} from "./ui";

const ERROR_RED = "No se pudo guardar. Revisa tu conexión e intenta de nuevo.";

// Aviso flotante de error (sobre la barra inferior en celular). Se cierra solo.
function AvisoError({ mensaje, alCerrar }: { mensaje: string; alCerrar: () => void }) {
  const cerrar = useRef(alCerrar);
  useEffect(() => {
    cerrar.current = alCerrar;
  });
  useEffect(() => {
    const t = setTimeout(() => cerrar.current(), 6000);
    return () => clearTimeout(t);
  }, [mensaje]);
  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex items-start gap-2.5 rounded-control bg-tinta py-2.5 pr-1.5 pl-3.5 text-left text-sm font-medium whitespace-normal text-white shadow-elevada ring-1 ring-white/10 animate-aparecer md:right-6 md:bottom-6 md:left-auto md:w-96"
    >
      <Icono nombre="alerta" className="mt-0.5 size-4 shrink-0 text-red-300" />
      <span className="min-w-0 flex-1 py-px">{mensaje}</span>
      <button
        type="button"
        onClick={alCerrar}
        aria-label="Cerrar aviso"
        className="-my-1 grid size-8 shrink-0 place-items-center rounded-md text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 max-md:size-10"
      >
        <Icono nombre="equis" className="size-4" />
      </button>
    </div>
  );
}

function Giro({ className = "size-4 border-white/40 border-t-white" }: { className?: string }) {
  return <span aria-hidden className={`shrink-0 animate-spin rounded-full border-2 ${className}`} />;
}

// Formulario de alta: muestra el error del servidor y solo se limpia si se guardó bien.
// Si la red falla, avisa y conserva lo escrito para reintentar.
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
  const [estado, enviar, pendiente] = useActionState(async (previo: Estado, form: FormData) => {
    try {
      return await accion(previo, form);
    } catch {
      return { error: ERROR_RED };
    }
  }, {});
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
      aria-busy={pendiente}
      onSubmit={(e) => {
        e.preventDefault();
        if (pendiente) return;
        setGuardado(false);
        const datos = new FormData(e.currentTarget);
        startTransition(() => enviar(datos));
      }}
      className="grid grid-cols-2 gap-x-2.5 gap-y-3 sm:flex sm:flex-wrap sm:items-end sm:gap-3"
    >
      {children}
      {/* Las dos capas ocupan la misma celda: el botón no cambia de ancho al guardar. */}
      <button
        disabled={pendiente}
        className={`${claseBotonPrimario} disabled:cursor-wait max-sm:col-span-2`}
      >
        <span className="grid">
          <span
            className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-2 ${pendiente ? "invisible" : ""}`}
          >
            <Icono nombre={icono} className="size-4 shrink-0" />
            {textoBoton}
          </span>
          <span
            className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-2 ${pendiente ? "" : "invisible"}`}
          >
            <Giro className="size-4 border-current/30 border-t-current" />
            Guardando…
          </span>
        </span>
      </button>
      <div aria-live="polite" className="contents">
        {guardado && !pendiente && (
          <p
            role="status"
            className="col-span-2 inline-flex items-center gap-1.5 justify-self-start rounded-full bg-exito-claro px-2.5 py-1 text-sm font-medium text-green-800 ring-1 ring-green-300/60 ring-inset animate-aparecer sm:self-center"
          >
            <Icono nombre="checkCirculo" className="size-4" />
            Guardado
          </p>
        )}
      </div>
      {estado.error && !pendiente && (
        <p
          role="alert"
          className="col-span-2 flex w-full items-start gap-2 rounded-control border-l-[3px] border-l-acento bg-acento-claro px-3 py-2.5 text-sm font-medium text-red-800 ring-1 ring-acento/20 ring-inset animate-aparecer"
        >
          <Icono nombre="alerta" className="mt-0.5 size-4 shrink-0" />
          <span>{estado.error}</span>
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
  const [error, setError] = useState<string | null>(null);
  // "¿Borrar el pedido X?" -> "Borrar el pedido X", para distinguir cada fila con lector de pantalla.
  const etiqueta = pregunta.replace(/^¿/, "").replace(/\?$/, "").trim() || "Borrar";
  return (
    <>
      <button
        type="button"
        disabled={pendiente}
        aria-label={pendiente ? "Borrando…" : etiqueta}
        aria-busy={pendiente}
        title={etiqueta}
        onClick={() => {
          if (!confirm(`${pregunta}\n\nEsta acción no se puede deshacer.`)) return;
          setError(null);
          iniciar(async () => {
            try {
              await accion();
            } catch {
              setError("No se pudo borrar. Revisa tu conexión o si el registro tiene otros datos asociados.");
            }
          });
        }}
        className={`${claseBotonIcono} focus-visible:opacity-100 disabled:cursor-wait [@media(hover:hover)]:md:opacity-40 [@media(hover:hover)]:md:group-hover:opacity-100 ${pendiente ? "opacity-100!" : ""}`}
      >
        {pendiente ? (
          <Giro className="size-3.5 border-current border-r-transparent" />
        ) : (
          <Icono nombre="basura" className="size-4" />
        )}
      </button>
      {error && <AvisoError mensaje={error} alCerrar={() => setError(null)} />}
    </>
  );
}

// Muestra el estatus nuevo mientras se guarda; si falla vuelve solo al anterior y avisa.
export function SelectEstatus({
  estatus,
  accion,
}: {
  estatus: (typeof ESTATUS_VIAJE)[number];
  accion: (estatus: string) => Promise<void>;
}) {
  const [pendiente, iniciar] = useTransition();
  const [visible, setVisible] = useOptimistic(estatus);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="relative inline-flex items-center">
      {pendiente ? (
        <Giro className="pointer-events-none absolute left-2 size-3 border-current border-r-transparent" />
      ) : (
        <span aria-hidden className={`pointer-events-none absolute left-2.5 size-1.5 rounded-full ${PUNTO_ESTATUS[visible]}`} />
      )}
      <select
        aria-label="Estatus"
        aria-busy={pendiente}
        value={visible}
        disabled={pendiente}
        onChange={(e) => {
          const nuevo = e.target.value as (typeof ESTATUS_VIAJE)[number];
          setError(null);
          iniciar(async () => {
            setVisible(nuevo);
            try {
              await accion(nuevo);
            } catch {
              setError(`No se pudo cambiar el estatus a "${nuevo}". Revisa tu conexión e intenta de nuevo.`);
            }
          });
        }}
        className={`h-7 cursor-pointer appearance-none rounded-full bg-none py-0 pr-6 pl-6 text-xs font-semibold shadow-control ring-1 ring-inset transition hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca disabled:cursor-wait disabled:opacity-70 max-md:h-10 max-md:pr-7 max-md:pl-7 max-md:text-base ${ESTILO_ESTATUS[visible]}`}
      >
        {ESTATUS_ASIGNADO.map((e) => (
          <option key={e}>{e}</option>
        ))}
      </select>
      <Icono nombre="chevron" className="pointer-events-none absolute right-2 size-3 opacity-60" grosor={2.5} />
      {error && <AvisoError mensaje={error} alCerrar={() => setError(null)} />}
    </span>
  );
}

// Viaje "Por asignar": la oficina elige camión y piloto y queda Programado.
export function AsignarViaje({
  camiones,
  pilotos,
  accion,
}: {
  camiones: { id: number; placa: string }[];
  pilotos: { id: number; nombre: string }[];
  accion: (estado: Estado, form: FormData) => Promise<Estado>;
}) {
  const [estado, enviar, pendiente] = useActionState(async (previo: Estado, form: FormData) => {
    try {
      return await accion(previo, form);
    } catch {
      return { error: ERROR_RED };
    }
  }, {});
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- muestra el error recién llegado
    if (estado.error) setError(estado.error);
  }, [estado]);
  const claseSelect = `${claseInput} h-9! text-sm! sm:w-full`;
  return (
    <form
      aria-busy={pendiente}
      onSubmit={(e) => {
        e.preventDefault();
        if (pendiente) return;
        setError(null);
        const datos = new FormData(e.currentTarget);
        startTransition(() => enviar(datos));
      }}
      className="flex min-w-44 flex-col gap-1.5"
    >
      <select name="camionId" required defaultValue="" aria-label="Camión" disabled={pendiente} className={claseSelect}>
        <option value="" disabled>Camión…</option>
        {camiones.map((c) => (
          <option key={c.id} value={c.id}>{c.placa}</option>
        ))}
      </select>
      <select name="pilotoId" required defaultValue="" aria-label="Piloto" disabled={pendiente} className={claseSelect}>
        <option value="" disabled>Piloto…</option>
        {pilotos.map((p) => (
          <option key={p.id} value={p.id}>{p.nombre}</option>
        ))}
      </select>
      <button disabled={pendiente} className={`${claseBotonPrimario} h-9! disabled:cursor-wait`}>
        {pendiente ? <Giro className="size-4 border-current/30 border-t-current" /> : <Icono nombre="check" className="size-4" />}
        {pendiente ? "Asignando…" : "Asignar"}
      </button>
      {error && <AvisoError mensaje={error} alCerrar={() => setError(null)} />}
    </form>
  );
}

const texto = (n: number) => String(n);

// Se guarda al salir del campo o con Enter; Escape deshace. Si falla, vuelve al monto anterior y avisa.
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
  const [valor, setValor] = useState(() => texto(monto));
  const [base, setBase] = useState(monto);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelado = useRef(false);

  // Si el servidor trae otro monto (p. ej. tras guardar), el campo lo refleja.
  if (base !== monto) {
    setBase(monto);
    setValor(texto(monto));
  }

  useEffect(() => {
    if (!guardado) return;
    const t = setTimeout(() => setGuardado(false), 1500);
    return () => clearTimeout(t);
  }, [guardado]);

  const guardar = () => {
    if (cancelado.current) {
      cancelado.current = false;
      return;
    }
    const limpio = valor.trim().replace(",", ".");
    const nuevo = Number(limpio);
    if (limpio === "" || !Number.isFinite(nuevo) || nuevo < 0) {
      setValor(texto(monto));
      if (limpio !== "") setError("Escribe un monto válido (0 o más).");
      return;
    }
    if (nuevo === monto) {
      setValor(texto(monto));
      return;
    }
    setError(null);
    setGuardado(false);
    iniciar(async () => {
      try {
        await accion(nuevo);
        setGuardado(true);
      } catch {
        setValor(texto(monto));
        setError(`${ERROR_RED} Se dejó el monto anterior.`);
      }
    });
  };

  return (
    <span className="relative inline-flex items-center">
      {pendiente ? (
        <Giro className="pointer-events-none absolute left-2.5 size-3.5 border-marca/30 border-t-marca" />
      ) : (
        <span aria-hidden className="pointer-events-none absolute left-2.5 text-sm text-tenue">Q</span>
      )}
      <input
        type="number"
        inputMode="decimal"
        autoComplete="off"
        enterKeyHint="done"
        step="0.01"
        min="0"
        aria-label={etiqueta}
        aria-busy={pendiente}
        value={valor}
        readOnly={pendiente}
        onChange={(e) => setValor(e.target.value)}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancelado.current = true;
            setValor(texto(monto));
            e.currentTarget.blur();
          }
        }}
        onBlur={guardar}
        className={`h-11 w-32 appearance-none rounded-control border bg-white pr-2.5 pl-7 text-right [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none text-base tabular-nums shadow-control transition-[border-color,box-shadow,opacity] duration-150 hover:border-slate-400 focus:border-marca focus:outline-none focus:ring-4 focus:ring-marca/15 sm:h-9 sm:text-sm ${pendiente ? "cursor-wait opacity-60" : ""} ${guardado ? "border-exito ring-2 ring-exito/40" : "border-borde-fuerte"}`}
      />
      {guardado && (
        <span role="status" className="sr-only">
          Monto guardado
        </span>
      )}
      {error && <AvisoError mensaje={error} alCerrar={() => setError(null)} />}
    </span>
  );
}

// Copia al portapapeles; si el navegador no deja (http, permisos), usa el método antiguo.
async function copiarTexto(valor: string) {
  try {
    await navigator.clipboard.writeText(valor);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = valor;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

// 40px de alto mínimo también con mouse (los botones base bajan a 36px en sm+).
const alto = "sm:h-10!";

// Enlace personal del chofer a su app: crear, copiar, enviar por WhatsApp,
// reemplazar o quitar. Sin token, el chofer no tiene acceso.
export function EnlaceChofer({
  nombre,
  enlace,
  generar,
  quitar,
}: {
  nombre: string;
  enlace: string | null;
  generar: () => Promise<void>;
  quitar: () => Promise<void>;
}) {
  const [pendiente, iniciar] = useTransition();
  const [accionActual, setAccionActual] = useState<"generar" | "quitar" | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(t);
  }, [copiado]);

  const ejecutar = (cual: "generar" | "quitar", fn: () => Promise<void>) => {
    setError(null);
    setAccionActual(cual);
    iniciar(async () => {
      try {
        await fn();
      } catch {
        setError(ERROR_RED);
      }
    });
  };

  const giro = <Giro className="size-4 border-current/30 border-t-current" />;
  const cargando = (cual: "generar" | "quitar") => pendiente && accionActual === cual;

  const encabezado = (
    <p className="flex items-center gap-2 text-eyebrow font-semibold tracking-[0.1em] text-tenue uppercase">
      <Icono nombre="celular" className="size-3.5" />
      App del chofer
      {enlace ? (
        <Insignia tono="exito" punto>
          <span className="tracking-normal normal-case">Con acceso</span>
        </Insignia>
      ) : (
        <span className="font-medium tracking-normal text-suave normal-case">· sin acceso</span>
      )}
    </p>
  );

  if (!enlace) {
    return (
      <div className="space-y-2">
        {encabezado}
        <button
          type="button"
          disabled={pendiente}
          aria-busy={pendiente}
          onClick={() => ejecutar("generar", generar)}
          className={`${claseBotonSecundario} ${alto} disabled:cursor-wait max-sm:w-full`}
        >
          {cargando("generar") ? giro : <Icono nombre="enlace" className="size-4" />}
          Crear enlace
        </button>
        {error && <AvisoError mensaje={error} alCerrar={() => setError(null)} />}
      </div>
    );
  }

  const mensaje =
    `Hola ${nombre}, este es tu enlace a la app de choferes de TransVelsa:\n${enlace}\n\n` +
    "Ábrelo en tu celular y agrégalo a la pantalla de inicio. Es personal: no lo compartas.";

  return (
    <div className="space-y-2">
      {encabezado}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <div className="col-span-2 flex min-w-0 gap-2 sm:min-w-64 sm:flex-1">
          <span
            title={enlace}
            className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-control bg-fondo px-3 ring-1 ring-borde ring-inset sm:h-10"
          >
            <Icono nombre="enlace" className="size-4 shrink-0 text-marca" />
            <span className="truncate font-mono text-xs text-tinta">{enlace.replace(/^https?:\/\//, "")}</span>
          </span>
          <button
            type="button"
            aria-label={copiado ? "Enlace copiado" : `Copiar enlace de ${nombre}`}
            onClick={async () => {
              setError(null);
              if (await copiarTexto(enlace)) setCopiado(true);
              else setError("No se pudo copiar. Mantén presionado el enlace para copiarlo a mano.");
            }}
            className={`${claseBotonSecundario} ${alto} shrink-0 ${copiado ? "text-green-800 ring-green-300" : ""}`}
          >
            <Icono nombre={copiado ? "check" : "copiar"} className="size-4" />
            <span aria-hidden>{copiado ? "Copiado" : "Copiar"}</span>
          </button>
          <span role="status" className="sr-only">
            {copiado ? "Enlace copiado" : ""}
          </span>
        </div>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${claseBotonPrimario} ${alto} col-span-2`}
        >
          <Icono nombre="mensaje" className="size-4" />
          Enviar por WhatsApp
        </a>
        <button
          type="button"
          disabled={pendiente}
          aria-busy={cargando("generar")}
          onClick={() => {
            if (
              !confirm(
                `¿Crear un enlace nuevo para ${nombre}?\n\nEl enlace actual dejará de funcionar y tendrás que enviarle el nuevo.`,
              )
            )
              return;
            ejecutar("generar", generar);
          }}
          className={`${claseBotonSecundario} ${alto} disabled:cursor-wait`}
        >
          {cargando("generar") ? giro : <Icono nombre="recargar" className="size-4" />}
          Nuevo enlace
        </button>
        <button
          type="button"
          disabled={pendiente}
          aria-busy={cargando("quitar")}
          onClick={() => {
            if (
              !confirm(
                `¿Quitar el acceso de ${nombre} a la app?\n\nSu enlace dejará de funcionar. Puedes crear uno nuevo cuando quieras.`,
              )
            )
              return;
            ejecutar("quitar", quitar);
          }}
          className={`${claseBotonPeligro} ${alto} disabled:cursor-wait`}
        >
          {cargando("quitar") ? giro : <Icono nombre="equis" className="size-4" />}
          Quitar acceso
        </button>
      </div>
      {error && <AvisoError mensaje={error} alCerrar={() => setError(null)} />}
    </div>
  );
}
