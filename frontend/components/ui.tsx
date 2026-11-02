import Form from "next/form";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatoQ } from "@/lib/formato";
import { Icono, type NombreIcono } from "./iconos";

export { Icono, type NombreIcono } from "./iconos";

export function Encabezado({
  titulo,
  descripcion,
  eyebrow = "TransVelsa",
  icono,
  acciones,
}: {
  titulo: string;
  descripcion: string;
  eyebrow?: string;
  icono?: NombreIcono;
  acciones?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-start gap-4">
        {icono && (
          <span className="mt-1 hidden size-12 shrink-0 place-items-center rounded-xl bg-tinta text-white shadow-elevada ring-1 ring-white/10 sm:grid">
            <Icono nombre={icono} className="size-6 text-blue-400" />
          </span>
        )}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-acento-oscuro">{eyebrow}</p>
          <h1 className="mt-1 font-display text-[26px] font-bold leading-tight tracking-tight text-tinta sm:text-[32px]">
            {titulo}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-tenue">{descripcion}</p>
          <div className="franja-marca mt-3 h-1 w-14 rounded-full" />
        </div>
      </div>
      {acciones && <div className="flex flex-wrap gap-2 max-sm:w-full">{acciones}</div>}
    </div>
  );
}

const ICONO_TONO = {
  marca: "bg-marca-50 text-marca ring-marca/10",
  acento: "bg-acento-claro text-acento ring-acento/10",
  exito: "bg-exito-claro text-exito ring-exito/10",
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
}) {
  return (
    <section className="overflow-hidden rounded-tarjeta bg-superficie shadow-tarjeta ring-1 ring-borde">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-borde px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          {icono ? (
            <span className={`grid size-8 shrink-0 place-items-center rounded-lg ring-1 ${ICONO_TONO[tono]}`}>
              <Icono nombre={icono} className="size-4" />
            </span>
          ) : (
            <span className="h-4 w-1 rounded-full bg-marca" />
          )}
          <div className="min-w-0">
            <h2 className="font-display text-[15px] font-semibold uppercase tracking-[0.06em] text-tinta">{titulo}</h2>
            {descripcion && <p className="text-xs text-tenue">{descripcion}</p>}
          </div>
          {extra}
        </div>
        {acciones}
      </header>
      <div className={flush ? "" : "p-4 sm:p-5"}>{children}</div>
    </section>
  );
}

export function Pastilla({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-tinta">
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
}: {
  etiqueta: string;
  ancho?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      className={`flex min-w-0 flex-col gap-1.5 text-xs font-medium text-tenue max-sm:[&>*]:w-full ${ancho ? "max-sm:col-span-2" : ""}`}
    >
      {etiqueta}
      {children}
    </label>
  );
}

// text-base en celular evita que iOS haga zoom al enfocar.
export const claseInput =
  "h-11 min-w-0 rounded-control border border-borde-fuerte bg-white px-3 text-base text-tinta shadow-[0_1px_0_rgb(10_13_20/0.03)] transition placeholder:text-suave hover:border-slate-400 focus:border-marca focus:outline-none focus:ring-4 focus:ring-marca/15 disabled:bg-slate-50 disabled:text-suave sm:h-9 sm:text-sm";

// inline-flex: sirven igual en <button> y en <a>.
const base =
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-control px-4 text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>svg]:size-4 sm:h-9";

export const claseBotonPrimario = `${base} bg-marca text-white shadow-boton hover:bg-marca-oscuro focus-visible:ring-marca`;
export const claseBotonSecundario = `${base} bg-white text-tinta ring-1 ring-inset ring-borde-fuerte hover:bg-marca-50 hover:text-marca hover:ring-marca/40 focus-visible:ring-2 focus-visible:ring-marca`;
export const claseBotonFantasma = `${base} text-tenue hover:bg-slate-100 hover:text-tinta focus-visible:ring-marca`;
export const claseBotonIcono =
  "grid size-8 place-items-center rounded-lg text-tenue transition hover:bg-acento-claro hover:text-acento focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca focus-visible:ring-offset-2 disabled:opacity-40 max-lg:size-10";

// Filtros por URL (GET). En celular se acomodan en dos columnas.
export function Filtros({
  action,
  boton = "Filtrar",
  children,
  activos,
}: {
  action: string;
  boton?: string;
  children: ReactNode;
  /** Muestra "Limpiar" cuando hay algún filtro aplicado. */
  activos?: boolean;
}) {
  return (
    <Form
      action={action}
      className="grid w-full grid-cols-2 items-end gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-2.5 max-sm:[&>select]:w-full"
    >
      {children}
      <button className={`${claseBotonSecundario} max-sm:col-span-2`}>
        <Icono nombre="filtro" />
        {boton}
      </button>
      {activos && (
        <Link href={action} className={`${claseBotonFantasma} max-sm:col-span-2`}>
          <Icono nombre="equis" />
          Limpiar
        </Link>
      )}
    </Form>
  );
}

// Filtros a la izquierda; a la derecha un <div className="flex flex-wrap items-center gap-2 max-sm:w-full">.
export function BarraHerramientas({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 rounded-tarjeta bg-superficie p-3 shadow-tarjeta ring-1 ring-borde sm:p-4">
      {children}
    </div>
  );
}

// Fondo propio para separar el formulario de alta de la tabla.
export function PanelAlta({ children, titulo }: { children: ReactNode; titulo?: string }) {
  return (
    <div className="rounded-xl bg-fondo p-3 ring-1 ring-borde ring-inset sm:p-4">
      {titulo && (
        <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.06em] text-tinta">
          <Icono nombre="mas" className="size-4 text-marca" />
          {titulo}
        </h3>
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
      <p className="flex items-center gap-1.5 text-xs text-tenue">
        <Icono nombre="info" className="size-3.5 shrink-0" />
        <span>{children}</span>
      </p>
    );
  }
  const alerta = tono === "alerta";
  return (
    <div
      className={`flex gap-2 rounded-control px-3 py-2.5 text-sm ring-1 ring-inset ${alerta ? "bg-alerta-claro text-amber-900 ring-amber-300/60" : "bg-marca-50 text-marca-oscuro ring-marca/15"}`}
    >
      <Icono nombre={alerta ? "reloj" : "info"} className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

// Estilo placa guatemalteca: franja azul arriba.
export function Placa({ placa, grande }: { placa: string; grande?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border border-borde-fuerte border-t-[3px] border-t-marca bg-white font-mono font-semibold tracking-wider text-tinta ${grande ? "px-2.5 py-1 text-sm" : "px-1.5 py-0.5 text-xs"}`}
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
          ? "grid size-10 shrink-0 place-items-center rounded-full bg-marca font-display text-base font-bold text-white ring-2 ring-white/20"
          : "grid size-7 shrink-0 place-items-center rounded-full bg-marca-50 text-[11px] font-bold text-marca ring-1 ring-marca/15"
      }
    >
      {iniciales(nombre)}
    </span>
  );
}

// Siempre con signo + o − además del color.
export function Resultado({ valor, oscuro }: { valor: number; oscuro?: boolean }) {
  const texto = `${valor < 0 ? "−" : "+"}${formatoQ(Math.abs(valor))}`;
  if (oscuro) {
    return (
      <span className={`font-semibold tabular-nums ${valor < 0 ? "text-red-300" : "text-green-300"}`}>{texto}</span>
    );
  }
  return (
    <span
      className={`inline-flex rounded-md px-1.5 py-0.5 text-[13px] font-semibold tabular-nums ${valor < 0 ? "bg-acento-claro text-red-800" : "bg-exito-claro text-green-800"}`}
    >
      {texto}
    </span>
  );
}

export const claseTabla =
  "w-full text-sm [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-middle [&_th]:px-3 [&_th]:py-2.5 [&_td:first-child]:pl-4 [&_th:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:last-child]:pr-4 sm:[&_td:first-child]:pl-5 sm:[&_th:first-child]:pl-5 sm:[&_td:last-child]:pr-5 sm:[&_th:last-child]:pr-5";
export const claseThead =
  "bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-tenue [&_th]:border-b [&_th]:border-borde";
// `group` permite que BotonBorrar se aclare con el hover de la fila.
export const claseFila = "group border-b border-borde/70 transition-colors last:border-0 hover:bg-marca-50/70";
export const claseTotal = "border-t-2 border-tinta bg-slate-50 font-semibold text-tinta [&_td]:py-3";

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
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      <span className="relative grid size-14 place-items-center rounded-2xl bg-slate-100 text-suave ring-8 ring-slate-50">
        <Icono nombre={icono} className="size-6" />
        <span aria-hidden className="absolute -right-1 -bottom-1 h-1.5 w-6 -skew-x-12 rounded-sm bg-acento/80" />
      </span>
      {titulo && <p className="font-display text-base font-semibold text-tinta">{titulo}</p>}
      <p className="max-w-sm text-sm text-tenue">{children}</p>
      {accion}
    </div>
  );
}

export function Cargando() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-tarjeta bg-superficie p-4 shadow-tarjeta ring-1 ring-borde sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="esqueleto h-3 w-20 rounded" />
              <div className="esqueleto size-9 rounded-xl" />
            </div>
            <div className="esqueleto mt-2 h-7 w-28 rounded-md" />
            <div className="esqueleto mt-2 h-3 w-16 rounded" />
          </div>
        ))}
      </div>
      {[0, 1].map((t) => (
        <div key={t} className="overflow-hidden rounded-tarjeta bg-superficie shadow-tarjeta ring-1 ring-borde">
          <div className="flex items-center gap-2.5 border-b border-borde px-4 py-3.5 sm:px-5">
            <div className="esqueleto size-8 rounded-lg" />
            <div className="esqueleto h-4 w-40 rounded" />
          </div>
          <div className="space-y-2 p-4 sm:p-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="esqueleto h-9 rounded-lg" style={{ opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        </div>
      ))}
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
        className="relative isolate overflow-hidden rounded-tarjeta bg-tinta p-4 text-white shadow-elevada animate-entrada sm:p-5"
      >
        <div aria-hidden className="franjas-diagonales absolute inset-y-0 right-0 -z-10 w-2/3 opacity-30" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_100%_0%,rgb(29_78_216/0.45),transparent_60%)]"
        />
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 min-w-0 text-[11px] leading-tight font-semibold uppercase tracking-[0.1em] text-blue-200">{etiqueta}</p>
          {icono && (
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 max-sm:hidden">
              <Icono nombre={icono} className="size-[18px]" />
            </span>
          )}
        </div>
        <p className="mt-2 text-[clamp(1.05rem,5vw,1.5rem)] leading-tight font-semibold tracking-tight wrap-break-word tabular-nums sm:text-2xl xl:text-[28px]">
          {valor}
        </p>
        {nota && <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-300">{nota}</p>}
        {progreso !== undefined && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full origin-left rounded-full bg-white animate-crecer-x"
              style={{ width: `${acotar(progreso)}%` }}
            />
          </div>
        )}
        <div className="franja-marca absolute inset-x-0 bottom-0 h-1" />
      </div>
    );
  }
  const claseIcono =
    tono === "acento" ? ICONO_TONO.acento : tono === "exito" ? ICONO_TONO.exito : ICONO_TONO.marca;
  return (
    <div
      title={`${etiqueta}: ${valor}`}
      style={estilo}
      className="group relative overflow-hidden rounded-tarjeta bg-superficie p-4 shadow-tarjeta ring-1 ring-borde transition animate-entrada sm:p-5 [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-elevada"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 min-w-0 text-[11px] leading-tight font-semibold uppercase tracking-[0.1em] text-tenue">{etiqueta}</p>
        {icono && (
          <span className={`grid size-9 shrink-0 place-items-center rounded-xl ring-1 max-sm:hidden ${claseIcono}`}>
            <Icono nombre={icono} className="size-[18px]" />
          </span>
        )}
      </div>
      <p className="mt-2 text-[clamp(1.05rem,5vw,1.5rem)] leading-tight font-semibold tracking-tight wrap-break-word tabular-nums text-tinta sm:text-2xl xl:text-[28px]">
        {valor}
      </p>
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
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full origin-left rounded-full bg-marca animate-crecer-x"
            style={{ width: `${acotar(progreso)}%` }}
          />
        </div>
      )}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-marca transition group-hover:scale-x-100"
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
