import Form from "next/form";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatoQ } from "@/lib/formato";
import { Icono, type NombreIcono } from "./iconos";
import { PlegableMovil } from "./plegable";

export { Icono, type NombreIcono } from "./iconos";

export function Encabezado({
  titulo,
  descripcion,
  eyebrow = "TransVelsa",
  icono,
  acciones,
  meta,
}: {
  titulo: string;
  descripcion: string;
  eyebrow?: string;
  icono?: NombreIcono;
  acciones?: ReactNode;
  /** Fila opcional bajo la descripción (Insignia, fechas, contexto). */
  meta?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 items-start gap-4">
        {icono && (
          <span className="relative mt-0.5 hidden size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-cabina text-white shadow-elevada ring-1 ring-white/10 sm:grid">
            <span
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(90%_90%_at_100%_0%,rgb(29_78_216/0.6),transparent_65%)]"
            />
            <Icono nombre={icono} className="relative size-6 text-white" />
            <span aria-hidden className="franja-marca absolute inset-x-0 bottom-0 h-1" />
          </span>
        )}
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-eyebrow font-semibold uppercase tracking-[0.18em] text-acento-oscuro">
            <span aria-hidden className="franja-marca h-1 w-5 rounded-full sm:hidden" />
            {eyebrow}
          </p>
          <h1 className="mt-1 font-display text-titulo font-bold tracking-tight text-tinta sm:text-titulo-lg">
            {titulo}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-tenue sm:text-[15px]">{descripcion}</p>
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
      </div>
      {acciones && <div className="flex flex-wrap gap-2 max-sm:w-full max-sm:*:flex-1">{acciones}</div>}
    </div>
  );
}

const ICONO_TONO = {
  marca: "bg-linear-to-b from-marca-50 to-marca-claro/70 text-marca ring-marca/15",
  acento: "bg-linear-to-b from-red-50 to-acento-claro text-acento-oscuro ring-acento/15",
  exito: "bg-linear-to-b from-green-50 to-exito-claro text-exito ring-exito/15",
};

export function Tarjeta({
  titulo,
  acciones,
  children,
  icono,
  descripcion,
  extra,
  flush,
  tono = "marca",
  pie,
  id,
}: {
  titulo: string;
  acciones?: ReactNode;
  children: ReactNode;
  icono?: NombreIcono;
  descripcion?: string;
  /** Va junto al título (pastillas, leyendas). */
  extra?: ReactNode;
  /** Sin relleno interior: para tablas de borde a borde. */
  flush?: boolean;
  tono?: "marca" | "acento";
  /** Pie opcional con fondo tenue (totales, notas, enlaces). */
  pie?: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="overflow-hidden rounded-tarjeta bg-superficie shadow-tarjeta ring-1 ring-borde">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-borde px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-x-3">
          {icono ? (
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-[10px] shadow-[inset_0_1px_0_rgb(255_255_255/0.7)] ring-1 ${ICONO_TONO[tono]}`}
            >
              <Icono nombre={icono} className="size-4.5" />
            </span>
          ) : (
            <span aria-hidden className={`h-5 w-1 rounded-full ${tono === "acento" ? "bg-acento" : "bg-marca"}`} />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="font-display text-lg leading-6 font-semibold tracking-tight text-tinta">{titulo}</h2>
              {extra}
            </div>
            {descripcion && <p className="text-xs leading-5 text-tenue">{descripcion}</p>}
          </div>
        </div>
        {acciones}
      </header>
      <div className={flush ? "" : "p-4 sm:p-5"}>{children}</div>
      {pie && <footer className="border-t border-borde bg-fondo/70 px-4 py-3 text-sm text-tenue sm:px-5">{pie}</footer>}
    </section>
  );
}

const TONO_INSIGNIA = {
  neutro: "bg-slate-100 text-slate-700 ring-slate-200",
  marca: "bg-marca-50 text-marca-oscuro ring-marca/20",
  exito: "bg-exito-claro text-green-800 ring-green-300/60",
  peligro: "bg-peligro-claro text-red-800 ring-red-300/60",
  alerta: "bg-alerta-claro text-amber-900 ring-amber-300/70",
  oscuro: "bg-tinta text-white ring-white/10",
};
const PUNTO_INSIGNIA = {
  neutro: "bg-slate-400",
  marca: "bg-marca",
  exito: "bg-exito",
  peligro: "bg-peligro",
  alerta: "bg-amber-500",
  oscuro: "bg-blue-400",
};
export type TonoInsignia = keyof typeof TONO_INSIGNIA;

// Contador junto al título de una Tarjeta.
export function Pastilla({ children, tono = "neutro" }: { children: ReactNode; tono?: TonoInsignia }) {
  return (
    <span
      className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums ring-1 ring-inset ${TONO_INSIGNIA[tono]}`}
    >
      {children}
    </span>
  );
}

// Etiqueta de estado o categoría. El texto siempre acompaña al color.
export function Insignia({
  children,
  tono = "neutro",
  punto,
  icono,
}: {
  children: ReactNode;
  tono?: TonoInsignia;
  punto?: boolean;
  icono?: NombreIcono;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONO_INSIGNIA[tono]}`}
    >
      {punto && <span aria-hidden className={`size-1.5 rounded-full ${PUNTO_INSIGNIA[tono]}`} />}
      {icono && <Icono nombre={icono} className="size-3.5" />}
      {children}
    </span>
  );
}

// En celular los campos ocupan todo el ancho de su columna; `ancho` los
// extiende a las dos columnas del formulario.
export function Campo({
  etiqueta,
  ancho,
  children,
  ayuda,
}: {
  etiqueta: string;
  ancho?: boolean;
  children: ReactNode;
  /** Texto pequeño bajo el control. */
  ayuda?: string;
}) {
  return (
    <label
      className={`flex min-w-0 flex-col gap-1.5 text-xs font-medium text-tenue max-sm:*:w-full ${ancho ? "max-sm:col-span-2" : ""}`}
    >
      <span className="leading-4">{etiqueta}</span>
      {children}
      {ayuda && <span className="text-[11px] leading-4 font-normal text-suave">{ayuda}</span>}
    </label>
  );
}

// text-base en celular evita que iOS haga zoom al enfocar.
export const claseInput =
  "h-11 min-w-0 rounded-control border border-borde-fuerte bg-white px-3 text-base text-tinta shadow-control transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-suave hover:border-slate-400 focus:border-marca focus:outline-none focus:ring-4 focus:ring-marca/15 disabled:cursor-not-allowed disabled:bg-fondo disabled:text-suave sm:h-9 sm:text-sm";

// inline-flex: sirven igual en <button> y en <a>.
const base =
  "inline-flex h-11 select-none items-center justify-center gap-2 whitespace-nowrap rounded-control px-4 text-sm font-semibold transition-[background-color,box-shadow,color,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0 sm:h-9 sm:px-3.5";

export const claseBotonPrimario = `${base} bg-marca bg-linear-to-b from-white/12 to-transparent text-white shadow-boton hover:bg-marca-oscuro focus-visible:ring-marca disabled:bg-none disabled:bg-fondo-2 disabled:text-tenue disabled:opacity-100 disabled:shadow-none disabled:ring-1 disabled:ring-inset disabled:ring-borde aria-disabled:bg-none aria-disabled:bg-fondo-2 aria-disabled:text-tenue aria-disabled:opacity-100 aria-disabled:shadow-none aria-disabled:ring-1 aria-disabled:ring-inset aria-disabled:ring-borde`;
export const claseBotonSecundario = `${base} bg-white text-tinta shadow-control ring-1 ring-inset ring-borde-fuerte hover:bg-marca-50 hover:text-marca-oscuro hover:ring-marca/35 focus-visible:ring-2 focus-visible:ring-marca`;
export const claseBotonFantasma = `${base} text-tenue hover:bg-fondo-2 hover:text-tinta focus-visible:ring-marca`;
/** Acción destructiva con texto (BotonBorrar es solo ícono). */
export const claseBotonPeligro = `${base} bg-white text-peligro shadow-control ring-1 ring-inset ring-red-200 hover:bg-peligro-claro focus-visible:ring-peligro`;
export const claseBotonIcono =
  "grid size-8 place-items-center rounded-lg text-tenue transition-colors hover:bg-acento-claro hover:text-acento-oscuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca focus-visible:ring-offset-2 disabled:opacity-40 max-lg:size-10";

// Filtros por URL (GET). En celular se acomodan en dos columnas;
// con `plegable` quedan detrás de un botón "Filtros".
export function Filtros({
  action,
  boton = "Filtrar",
  children,
  activos,
  limpiar = action,
  plegable,
}: {
  action: string;
  boton?: string;
  children: ReactNode;
  /** Muestra "Limpiar" cuando hay algún filtro aplicado. */
  activos?: boolean;
  /** A dónde lleva "Limpiar" (si la página aplica filtros por defecto). */
  limpiar?: string;
  /** Solo celular: oculta los campos tras un botón "Filtros". */
  plegable?: boolean;
}) {
  const contenido = (
    <>
      {children}
      <button className={`${claseBotonSecundario} max-sm:col-span-2`}>
        <Icono nombre="filtro" />
        {boton}
      </button>
      {activos && (
        <Link href={limpiar} className={`${claseBotonFantasma} max-sm:col-span-2`}>
          <Icono nombre="equis" />
          Limpiar
        </Link>
      )}
    </>
  );
  return (
    <Form
      action={action}
      className="grid w-full grid-cols-2 items-end gap-x-2.5 gap-y-3 sm:flex sm:w-auto sm:flex-wrap sm:gap-2.5 max-sm:[&>select]:w-full"
    >
      {plegable ? <PlegableMovil activos={activos}>{contenido}</PlegableMovil> : contenido}
    </Form>
  );
}

// Filtros a la izquierda; a la derecha un <div className="flex flex-wrap items-center gap-2 max-sm:w-full">.
export function BarraHerramientas({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 rounded-tarjeta bg-superficie p-3.5 shadow-tarjeta ring-1 ring-borde sm:p-4">
      {children}
    </div>
  );
}

// Fondo propio para separar el formulario de alta de la tabla.
export function PanelAlta({
  children,
  titulo,
  descripcion,
}: {
  children: ReactNode;
  titulo?: string;
  descripcion?: string;
}) {
  return (
    <div className="rounded-interno bg-linear-to-b from-fondo to-fondo/40 p-3 ring-1 ring-borde ring-inset sm:p-4">
      {titulo && (
        <div className="mb-3.5">
          <h3 className="flex items-center gap-2 font-display text-[15px] font-semibold tracking-tight text-tinta">
            <span className="grid size-5 place-items-center rounded-md bg-marca text-white">
              <Icono nombre="mas" className="size-3.5" grosor={2.25} />
            </span>
            {titulo}
          </h3>
          {descripcion && <p className="mt-1 text-xs text-tenue">{descripcion}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Nota({
  children,
  tono = "info",
}: {
  children: ReactNode;
  tono?: "info" | "alerta" | "ayuda";
}) {
  if (tono === "ayuda") {
    return (
      <p className="flex items-start gap-1.5 text-xs leading-5 text-tenue">
        <Icono nombre="info" className="mt-0.5 size-3.5 shrink-0" />
        <span>{children}</span>
      </p>
    );
  }
  const alerta = tono === "alerta";
  return (
    <div
      className={`flex gap-2.5 rounded-control border-l-[3px] px-3 py-2.5 text-sm leading-relaxed ring-1 ring-inset ${alerta ? "border-l-amber-500 bg-alerta-claro/80 text-amber-900 ring-amber-300/50" : "border-l-marca bg-marca-50 text-marca-oscuro ring-marca/12"}`}
    >
      <Icono nombre={alerta ? "alerta" : "info"} className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// Estilo placa guatemalteca: franja azul arriba.
export function Placa({ placa, grande }: { placa: string; grande?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border border-borde-fuerte border-t-[3px] border-t-marca bg-white font-mono font-semibold tracking-wider whitespace-nowrap text-tinta shadow-control ${grande ? "px-2.5 py-1 text-sm" : "px-1.5 py-0.5 text-xs"}`}
    >
      {placa}
    </span>
  );
}

function iniciales(nombre: string) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ nombre, oscuro }: { nombre: string; oscuro?: boolean }) {
  return (
    <span
      aria-hidden
      className={
        oscuro
          ? "grid size-10 shrink-0 place-items-center rounded-full bg-marca bg-linear-to-b from-white/15 to-transparent font-display text-base font-bold text-white ring-2 ring-white/20"
          : "grid size-7 shrink-0 place-items-center rounded-full bg-linear-to-b from-marca-50 to-marca-claro text-[11px] font-bold text-marca-oscuro ring-1 ring-marca/15"
      }
    >
      {iniciales(nombre)}
    </span>
  );
}

// Siempre con signo + o − además del color.
export function Resultado({ valor, oscuro }: { valor: number; oscuro?: boolean }) {
  const texto = `${valor < 0 ? "−" : valor > 0 ? "+" : ""}${formatoQ(Math.abs(valor))}`;
  if (oscuro) {
    return (
      <span className={`font-semibold whitespace-nowrap tabular-nums ${valor < 0 ? "text-red-300" : "text-green-300"}`}>
        {texto}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex rounded-md px-1.5 py-0.5 text-[13px] font-semibold whitespace-nowrap tabular-nums ring-1 ring-inset ${valor < 0 ? "bg-peligro-claro text-red-800 ring-red-200" : "bg-exito-claro text-green-800 ring-green-200"}`}
    >
      {texto}
    </span>
  );
}

// Monto con significado: entrada (verde, +), salida (rojo, −) o neutro.
export function Monto({
  valor,
  tipo = "neutro",
  className = "",
}: {
  valor: number;
  tipo?: "entrada" | "salida" | "neutro";
  className?: string;
}) {
  const color = tipo === "entrada" ? "text-exito" : tipo === "salida" ? "text-peligro" : "text-tinta";
  const signo = tipo === "entrada" ? "+" : tipo === "salida" ? "−" : "";
  return (
    <span className={`font-semibold whitespace-nowrap tabular-nums ${color} ${className}`}>
      {signo}
      {formatoQ(Math.abs(valor))}
    </span>
  );
}

/** Envoltura de tabla con scroll horizontal propio (nunca de la página). */
export const claseContenedorTabla = "overflow-x-auto scrollbar-thin";
export const claseTabla =
  "w-full text-sm [&_td]:px-3 [&_td]:py-3 [&_td]:align-middle [&_th]:px-3 [&_th]:py-2.5 [&_td:first-child]:pl-4 [&_th:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:last-child]:pr-4 sm:[&_td:first-child]:pl-5 sm:[&_th:first-child]:pl-5 sm:[&_td:last-child]:pr-5 sm:[&_th:last-child]:pr-5";
export const claseThead =
  "bg-fondo/80 text-left text-eyebrow font-semibold whitespace-nowrap uppercase tracking-[0.08em] text-tenue [&_th]:border-b [&_th]:border-borde";
// `group` permite que BotonBorrar se aclare con el hover de la fila.
export const claseFila =
  "group border-b border-borde/70 transition-colors duration-100 last:border-0 hover:bg-marca-50/60";
export const claseTotal =
  "border-t-2 border-tinta/85 bg-fondo font-semibold text-tinta [&_td]:py-3.5 [&_td]:tabular-nums";

/** Tarjeta de registro en celular (reemplaza la fila de tabla). */
export const claseTarjetaMovil =
  "relative overflow-hidden rounded-interno bg-superficie p-3.5 shadow-tarjeta ring-1 ring-borde";

// Total en negro al final de una lista de tarjetas (celular).
export function TotalMovil({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="relative isolate overflow-hidden rounded-interno bg-tinta px-4 py-3.5 text-white shadow-elevada">
      <div aria-hidden className="franjas-diagonales absolute inset-y-0 right-0 -z-10 w-1/2 opacity-20" />
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-eyebrow font-semibold uppercase tracking-[0.1em] text-plata">{etiqueta}</span>
        <span className="text-xl font-semibold tabular-nums">{valor}</span>
      </div>
      <div className="franja-marca absolute inset-x-0 bottom-0 h-0.5" />
    </div>
  );
}

export function Vacio({
  children,
  titulo,
  icono = "caja",
  accion,
}: {
  children: ReactNode;
  titulo?: string;
  icono?: NombreIcono;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center sm:py-14">
      <div aria-hidden className="relative mb-4">
        <span className="absolute -inset-3 rounded-[22px] border border-dashed border-borde-fuerte" />
        <span className="relative grid size-14 place-items-center rounded-2xl bg-linear-to-b from-white to-fondo-2 text-tenue shadow-tarjeta ring-1 ring-borde">
          <Icono nombre={icono} className="size-6" />
        </span>
        <span className="franja-marca absolute -right-2 -bottom-2 h-1.5 w-7 -skew-x-12 rounded-sm" />
      </div>
      {titulo && <p className="mt-2 font-display text-lg font-semibold tracking-tight text-tinta">{titulo}</p>}
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-tenue">{children}</p>
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  );
}

export function Cargando() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando" className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-tarjeta bg-superficie p-4 shadow-tarjeta ring-1 ring-borde sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="esqueleto h-3 w-20 rounded" />
              <div className="esqueleto size-9 rounded-[10px] max-sm:hidden" />
            </div>
            <div className="esqueleto mt-3 h-7 w-28 rounded-md" />
            <div className="esqueleto mt-2.5 h-3 w-16 rounded" />
          </div>
        ))}
      </div>
      {[0, 1].map((t) => (
        <div key={t} className="overflow-hidden rounded-tarjeta bg-superficie shadow-tarjeta ring-1 ring-borde">
          <div className="flex items-center gap-3 border-b border-borde px-4 py-4 sm:px-5">
            <div className="esqueleto size-9 rounded-[10px]" />
            <div className="esqueleto h-4 w-40 rounded" />
          </div>
          <div className="space-y-2.5 p-4 sm:p-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="esqueleto h-10 rounded-lg" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        </div>
      ))}
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

export type DatoKpi = {
  etiqueta: string;
  valor: string;
  destacado?: boolean;
  icono?: NombreIcono;
  /** Solo datos reales, nunca tendencias inventadas. */
  nota?: string;
  /** acento: ícono rojo (gastos). */
  tono?: "neutro" | "exito" | "peligro" | "acento";
  /** 0–100, se acota. */
  progreso?: number;
};

const acotar = (n: number) => Math.min(100, Math.max(0, Number.isFinite(n) ? n : 0));

// Cifra: se encoge en celular (2 columnas) y crece por pasos en pantallas grandes.
const claseCifraKpi =
  "mt-3 text-[clamp(1.125rem,5.6vw,1.625rem)] leading-tight font-semibold tracking-tight wrap-break-word tabular-nums sm:text-kpi xl:text-kpi 2xl:text-kpi-lg";

export function Kpi({
  etiqueta,
  valor,
  destacado,
  icono,
  nota,
  tono = "neutro",
  progreso,
  retraso = 0,
}: DatoKpi & { retraso?: number }) {
  const estilo = { animationDelay: `${retraso}ms` };
  if (destacado) {
    return (
      <div
        title={`${etiqueta}: ${valor}`}
        style={estilo}
        className="relative isolate flex flex-col overflow-hidden rounded-tarjeta bg-tinta p-4 text-white shadow-elevada ring-1 ring-white/5 animate-entrada sm:p-5"
      >
        <div aria-hidden className="franjas-diagonales absolute inset-y-0 right-0 -z-10 w-2/3 opacity-30" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_100%_0%,rgb(29_78_216/0.5),transparent_60%)]"
        />
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 min-w-0 text-eyebrow font-semibold uppercase tracking-[0.1em] text-blue-200">
            {etiqueta}
          </p>
          {icono && (
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-white/10 ring-1 ring-white/15 max-sm:hidden">
              <Icono nombre={icono} className="size-4.5" />
            </span>
          )}
        </div>
        <p className={claseCifraKpi}>{valor}</p>
        {nota && <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-300">{nota}</p>}
        {progreso !== undefined && (
          <div className="mt-auto pt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full origin-left rounded-full bg-white animate-crecer-x"
                style={{ width: `${acotar(progreso)}%` }}
              />
            </div>
          </div>
        )}
        <div className="franja-marca absolute inset-x-0 bottom-0 h-1" />
      </div>
    );
  }
  const claseIcono =
    tono === "acento" || tono === "peligro" ? ICONO_TONO.acento : tono === "exito" ? ICONO_TONO.exito : ICONO_TONO.marca;
  const barra = tono === "exito" ? "bg-exito" : tono === "acento" || tono === "peligro" ? "bg-acento" : "bg-marca";
  return (
    <div
      title={`${etiqueta}: ${valor}`}
      style={estilo}
      className="group relative flex flex-col overflow-hidden rounded-tarjeta bg-superficie p-4 shadow-tarjeta ring-1 ring-borde transition-[box-shadow,transform] duration-200 animate-entrada sm:p-5 [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-elevada"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 min-w-0 text-eyebrow font-semibold uppercase tracking-[0.1em] text-tenue">{etiqueta}</p>
        {icono && (
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-[10px] shadow-[inset_0_1px_0_rgb(255_255_255/0.7)] ring-1 max-sm:hidden ${claseIcono}`}
          >
            <Icono nombre={icono} className="size-4.5" />
          </span>
        )}
      </div>
      <p className={`${claseCifraKpi} text-tinta`}>{valor}</p>
      {nota && (
        <p
          className={`mt-1 flex items-start gap-1 text-xs leading-snug ${tono === "exito" ? "text-exito" : tono === "peligro" ? "text-peligro" : "text-tenue"}`}
        >
          {tono === "exito" && <Icono nombre="tendencia" className="mt-px size-3.5 shrink-0" />}
          {tono === "peligro" && <Icono nombre="tendenciaBaja" className="mt-px size-3.5 shrink-0" />}
          <span className="line-clamp-2">{nota}</span>
        </p>
      )}
      {progreso !== undefined && (
        <div className="mt-auto pt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-fondo-2">
            <div
              className={`h-full origin-left rounded-full animate-crecer-x ${barra}`}
              style={{ width: `${acotar(progreso)}%` }}
            />
          </div>
        </div>
      )}
      <span
        aria-hidden
        className={`absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${barra}`}
      />
    </div>
  );
}

export function Resumen({ datos }: { datos: DatoKpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {datos.map((d, i) => (
        <Kpi key={d.etiqueta} {...d} retraso={i * 40} />
      ))}
    </div>
  );
}
