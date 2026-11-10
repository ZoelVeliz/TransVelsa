import Link from "next/link";
import type { ReactNode } from "react";
import { formatoQ } from "@/lib/formato";
import { Icono, type NombreIcono } from "./iconos";
import { BotonFiltrar, FormFiltros } from "./filtros";
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
          <span className="panel-oscuro relative mt-1 hidden size-13 shrink-0 place-items-center overflow-hidden rounded-[14px] text-white sm:grid">
            <Icono nombre={icono} className="relative size-5.5 text-white" />
            <span aria-hidden className="franja-marca absolute inset-x-2 bottom-0 h-px" />
          </span>
        )}
        <div className="min-w-0">
          <p className="vidrio inline-flex items-center gap-2 rounded-full py-1 pr-3 pl-2 text-eyebrow font-medium tracking-[0.06em] text-tenue shadow-control ring-1 ring-borde">
            <span aria-hidden className="relative grid size-2 place-items-center">
              <span className="absolute size-2 rounded-full bg-marca/30 motion-safe:animate-ping" />
              <span className="size-1.5 rounded-full bg-marca" />
            </span>
            {eyebrow}
          </p>
          <h1 className="mt-2.5 font-display text-titulo font-semibold tracking-tight text-tinta sm:text-titulo-lg">
            {titulo}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-tenue sm:text-[15px]">{descripcion}</p>
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
      </div>
      {acciones && <div className="flex flex-wrap gap-2 max-sm:w-full max-sm:*:flex-1">{acciones}</div>}
    </div>
  );
}

const ICONO_TONO = {
  marca: "bg-linear-to-b from-white to-marca-50 text-marca ring-marca/15",
  acento: "bg-linear-to-b from-white to-acento-claro/70 text-acento-oscuro ring-acento/15",
  exito: "bg-linear-to-b from-white to-exito-claro/70 text-exito ring-exito/15",
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
    <section id={id} className="overflow-hidden rounded-tarjeta bg-superficie shadow-tarjeta ring-1 ring-borde animate-entrada">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-borde px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-x-3">
          {icono ? (
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-[9px] shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_1px_2px_rgb(17_24_39/0.06)] ring-1 ${ICONO_TONO[tono]}`}
            >
              <Icono nombre={icono} className="size-4" />
            </span>
          ) : (
            <span aria-hidden className={`h-5 w-1 rounded-full ${tono === "acento" ? "bg-acento" : "bg-marca"}`} />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="font-display text-[15px] leading-6 font-semibold tracking-tight text-tinta sm:text-base">{titulo}</h2>
              {extra}
            </div>
            {descripcion && <p className="text-xs leading-5 text-tenue">{descripcion}</p>}
          </div>
        </div>
        {acciones}
      </header>
      <div className={flush ? "" : "p-4 sm:p-5"}>{children}</div>
      {pie && <footer className="border-t border-borde bg-white/40 px-4 py-3 text-sm text-tenue sm:px-5">{pie}</footer>}
    </section>
  );
}

const TONO_INSIGNIA = {
  neutro: "bg-white/70 text-slate-700 ring-slate-900/10",
  marca: "bg-marca-50/80 text-marca-oscuro ring-marca/20",
  exito: "bg-exito-claro/70 text-green-800 ring-green-600/20",
  peligro: "bg-peligro-claro/70 text-red-800 ring-red-600/20",
  alerta: "bg-alerta-claro/70 text-amber-900 ring-amber-600/25",
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
  "h-11 min-w-0 rounded-control border border-borde-fuerte bg-white/85 px-3 text-base text-tinta shadow-[inset_0_1px_2px_rgb(17_24_39/0.04)] transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-suave hover:border-slate-900/25 hover:bg-white focus:border-marca focus:bg-white focus:outline-none focus:ring-4 focus:ring-marca/12 disabled:cursor-not-allowed disabled:bg-fondo disabled:text-suave sm:h-9 sm:text-sm";

// inline-flex: sirven igual en <button> y en <a>.
const base =
  "inline-flex h-11 select-none items-center justify-center gap-2 whitespace-nowrap rounded-control px-4 text-sm font-semibold transition-[background-color,box-shadow,color,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0 sm:h-9 sm:px-3.5";

export const claseBotonPrimario = `${base} bg-marca bg-linear-to-b from-white/18 to-transparent text-white shadow-boton hover:bg-marca-oscuro hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_20px_-6px_rgb(36_80_230/0.7)] focus-visible:ring-marca disabled:bg-none disabled:bg-fondo-2 disabled:text-tenue disabled:opacity-100 disabled:shadow-none disabled:ring-1 disabled:ring-inset disabled:ring-borde aria-disabled:bg-none aria-disabled:bg-fondo-2 aria-disabled:text-tenue aria-disabled:opacity-100 aria-disabled:shadow-none aria-disabled:ring-1 aria-disabled:ring-inset aria-disabled:ring-borde`;
export const claseBotonSecundario = `${base} bg-white/80 text-tinta shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_1px_2px_rgb(17_24_39/0.06)] ring-1 ring-inset ring-borde-fuerte hover:bg-white hover:text-marca-oscuro hover:ring-marca/30 focus-visible:ring-2 focus-visible:ring-marca`;
export const claseBotonFantasma = `${base} text-tenue hover:bg-white/70 hover:text-tinta focus-visible:ring-marca`;
/** Acción destructiva con texto (BotonBorrar es solo ícono). */
export const claseBotonPeligro = `${base} bg-white/80 text-peligro shadow-control ring-1 ring-inset ring-red-200 hover:bg-peligro-claro focus-visible:ring-peligro`;
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
      <BotonFiltrar className={`${claseBotonSecundario} max-sm:col-span-2`}>{boton}</BotonFiltrar>
      {activos && (
        <Link href={limpiar} className={`${claseBotonFantasma} max-sm:col-span-2`}>
          <Icono nombre="equis" />
          Limpiar
        </Link>
      )}
    </>
  );
  return (
    <FormFiltros
      action={action}
      className="grid w-full grid-cols-2 items-end gap-x-2.5 gap-y-3 sm:flex sm:w-auto sm:flex-wrap sm:gap-2.5 max-sm:[&>select]:w-full"
    >
      {plegable ? <PlegableMovil activos={activos}>{contenido}</PlegableMovil> : contenido}
    </FormFiltros>
  );
}

// Filtros a la izquierda; a la derecha un <div className="flex flex-wrap items-center gap-2 max-sm:w-full">.
export function BarraHerramientas({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 rounded-tarjeta bg-superficie p-3 shadow-tarjeta ring-1 ring-borde sm:p-3.5">
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
    <div className="rounded-interno bg-linear-to-b from-white/70 to-white/30 p-3 ring-1 ring-borde ring-inset sm:p-4">
      {titulo && (
        <div className="mb-3.5">
          <h3 className="flex items-center gap-2 font-display text-[15px] font-semibold tracking-tight text-tinta">
            <span className="grid size-5 place-items-center rounded-md bg-marca text-white shadow-boton">
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
      className={`flex gap-2.5 rounded-control border-l-[3px] px-3 py-2.5 text-sm leading-relaxed ring-1 ring-inset ${alerta ? "border-l-amber-500 bg-alerta-claro/60 text-amber-900 ring-amber-500/20" : "border-l-marca bg-marca-50/70 text-marca-oscuro ring-marca/12"}`}
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
      className={`inline-flex items-center rounded-md border border-borde-fuerte border-t-[3px] border-t-marca bg-white/90 font-mono font-semibold tracking-wider whitespace-nowrap text-tinta shadow-control ${grande ? "px-2.5 py-1 text-sm" : "px-1.5 py-0.5 text-xs"}`}
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
          ? "grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-marca to-violet-600 font-display text-base font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3)] ring-2 ring-white/15"
          : "grid size-7 shrink-0 place-items-center rounded-full bg-linear-to-br from-white to-marca-claro text-[11px] font-semibold text-marca-oscuro shadow-[inset_0_1px_0_white] ring-1 ring-marca/15"
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

/** Envoltura de tabla con scroll horizontal propio (nunca de la página).
 * `relative`: los sr-only (absolute) de las celdas quedan dentro y no ensanchan la página. */
export const claseContenedorTabla = "relative overflow-x-auto scrollbar-thin";
export const claseTabla =
  "w-full text-sm [&_td]:px-3 [&_td]:py-3 [&_td]:align-middle [&_th]:px-3 [&_th]:py-2.5 [&_td:first-child]:pl-4 [&_th:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:last-child]:pr-4 sm:[&_td:first-child]:pl-5 sm:[&_th:first-child]:pl-5 sm:[&_td:last-child]:pr-5 sm:[&_th:last-child]:pr-5";
export const claseThead =
  "bg-white/45 text-left text-eyebrow font-medium whitespace-nowrap uppercase tracking-[0.08em] text-suave [&_th]:border-b [&_th]:border-borde";
// `group` permite que BotonBorrar se aclare con el hover de la fila.
export const claseFila =
  "group border-b border-borde/70 transition-colors duration-100 last:border-0 hover:bg-white/75";
export const claseTotal =
  "border-t border-borde-fuerte bg-white/55 font-semibold text-tinta [&_td]:py-3.5 [&_td]:tabular-nums";

/** Tarjeta de registro en celular (reemplaza la fila de tabla). */
export const claseTarjetaMovil =
  "relative overflow-hidden rounded-interno bg-superficie p-3.5 shadow-tarjeta ring-1 ring-borde";

// Total en negro al final de una lista de tarjetas (celular).
export function TotalMovil({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="panel-oscuro relative isolate overflow-hidden rounded-interno px-4 py-3.5 text-white">
      <div aria-hidden className="franjas-diagonales absolute inset-y-0 right-0 -z-10 w-1/2 opacity-70" />
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
        <span className="absolute -inset-8 rounded-full bg-[radial-gradient(closest-side,rgb(36_80_230/0.14),transparent)]" />
        <span className="absolute -inset-3 rounded-[22px] border border-dashed border-borde-fuerte" />
        <span className="relative grid size-14 place-items-center rounded-2xl bg-linear-to-b from-white to-white/60 text-tenue shadow-elevada ring-1 ring-borde">
          <Icono nombre={icono} className="size-6" />
        </span>
      </div>
      {titulo && <p className="mt-2 font-display text-base font-semibold tracking-tight text-tinta">{titulo}</p>}
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
  "mt-3 text-[clamp(0.9375rem,12.5cqi,1.625rem)] leading-tight font-semibold tracking-[-0.025em] whitespace-nowrap tabular-nums max-sm:truncate sm:text-kpi sm:wrap-break-word sm:whitespace-normal 2xl:text-kpi-lg";

export function Kpi({
  etiqueta,
  valor,
  destacado,
  icono,
  nota,
  tono = "neutro",
  progreso,
  retraso = 0,
  className = "",
}: DatoKpi & { retraso?: number; className?: string }) {
  const estilo = { animationDelay: `${retraso}ms` };
  if (destacado) {
    return (
      <div
        title={`${etiqueta}: ${valor}`}
        style={estilo}
        className={`panel-oscuro @container relative isolate flex min-h-40 flex-col overflow-hidden rounded-tarjeta p-4 text-white animate-entrada sm:p-6 ${className}`}
      >
        <div aria-hidden className="franjas-diagonales absolute inset-y-0 right-0 -z-10 w-3/4 opacity-80" />
        {/* Brillo de cristal en la esquina */}
        <div
          aria-hidden
          className="absolute -top-24 -left-16 -z-10 size-64 rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.09),transparent)]"
        />
        {icono && (
          <Icono
            nombre={icono}
            grosor={1}
            className="pointer-events-none absolute -right-6 -bottom-8 -z-10 size-44 text-white/[0.05] max-lg:hidden"
          />
        )}
        <div className="flex items-start justify-between gap-2">
          <p className="inline-flex min-w-0 items-center gap-2 rounded-full bg-white/8 py-1 pr-3 pl-2 text-eyebrow font-medium tracking-[0.06em] text-blue-100 ring-1 ring-white/10">
            <span aria-hidden className="size-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgb(96_165_250)]" />
            <span className="truncate">{etiqueta}</span>
          </p>
          {icono && (
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-white/8 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] ring-1 ring-white/10 max-sm:hidden">
              <Icono nombre={icono} className="size-4.5" />
            </span>
          )}
        </div>
        <div className="mt-auto pt-6">
          <p className="bg-linear-to-b from-white to-white/70 bg-clip-text text-[clamp(1.375rem,11cqi,3.25rem)] leading-none font-semibold tracking-[-0.035em] whitespace-nowrap text-transparent tabular-nums">
            {valor}
          </p>
          {nota && <p className="mt-2 line-clamp-2 text-xs leading-snug text-slate-400 sm:text-sm">{nota}</p>}
          {progreso !== undefined && (
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full origin-left rounded-full bg-linear-to-r from-blue-400 to-white animate-crecer-x"
                style={{ width: `${acotar(progreso)}%` }}
              />
            </div>
          )}
        </div>
        <div aria-hidden className="franja-marca absolute inset-x-6 bottom-0 h-px opacity-80" />
      </div>
    );
  }
  const claseIcono =
    tono === "acento" || tono === "peligro" ? ICONO_TONO.acento : tono === "exito" ? ICONO_TONO.exito : ICONO_TONO.marca;
  const barra =
    tono === "exito"
      ? "bg-linear-to-r from-emerald-400 to-exito"
      : tono === "acento" || tono === "peligro"
        ? "bg-linear-to-r from-rose-400 to-acento"
        : "bg-linear-to-r from-sky-400 to-marca";
  const halo =
    tono === "exito"
      ? "rgb(16 185 129 / 0.14)"
      : tono === "acento" || tono === "peligro"
        ? "rgb(229 50 62 / 0.12)"
        : "rgb(36 80 230 / 0.12)";
  return (
    <div
      title={`${etiqueta}: ${valor}`}
      style={estilo}
      className={`@container group relative isolate flex flex-col overflow-hidden rounded-tarjeta bg-superficie p-4 shadow-tarjeta ring-1 ring-borde transition-[box-shadow,transform] duration-300 animate-entrada sm:p-5 [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-elevada ${className}`}
    >
      {/* Halo de color detrás del cristal */}
      <div
        aria-hidden
        style={{ background: `radial-gradient(closest-side, ${halo}, transparent)` }}
        className="absolute -top-16 -right-16 -z-10 size-48 rounded-full opacity-70 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 min-w-0 text-[13px] leading-5 font-medium text-tenue">{etiqueta}</p>
        {icono && (
          <span
            className={`grid size-8 shrink-0 place-items-center rounded-[9px] shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_1px_2px_rgb(17_24_39/0.06)] ring-1 max-sm:hidden ${claseIcono}`}
          >
            <Icono nombre={icono} className="size-4" />
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
        <div className="mt-auto pt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-900/[0.06]">
            <div
              className={`h-full origin-left rounded-full animate-crecer-x ${barra}`}
              style={{ width: `${acotar(progreso)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Bento: la cifra destacada va primero y ocupa un bloque de 2×2 en pantallas
 * grandes; las demás llenan el resto (la última se estira si sobra espacio).
 */
export function Resumen({ datos }: { datos: DatoKpi[] }) {
  const destacado = datos.find((d) => d.destacado);
  const resto = datos.filter((d) => d !== destacado);
  const estirarUltimo = destacado ? resto.length % 2 === 1 : false;
  return (
    <div
      className={`grid grid-cols-2 gap-3 sm:gap-4 ${destacado ? "lg:grid-cols-4" : "xl:grid-cols-4"}`}
    >
      {destacado && <Kpi {...destacado} retraso={0} className="col-span-2 lg:row-span-2" />}
      {resto.map((d, i) => (
        <Kpi
          key={d.etiqueta}
          {...d}
          retraso={(i + 1) * 50}
          className={estirarUltimo && i === resto.length - 1 ? "col-span-2" : ""}
        />
      ))}
    </div>
  );
}
