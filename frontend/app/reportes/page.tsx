import { Suspense } from "react";
import { RESPONSABLES } from "@/lib/constantes";
import type { Params } from "@/lib/filtros";
import { formatoQ, formatoQCorto } from "@/lib/formato";
import { obtenerReporte, resolverPeriodo, type Semana } from "@/lib/reporte";
import {
  BarraHerramientas,
  Campo,
  Cargando,
  claseBotonPrimario,
  claseFila,
  claseInput,
  claseTabla,
  claseThead,
  claseTotal,
  Encabezado,
  Filtros,
  Icono,
  Resultado,
  Resumen,
  Tarjeta,
  Vacio,
} from "@/components/ui";

export default function Page(props: PageProps<"/reportes">) {
  return (
    <div className="space-y-6 animate-entrada">
      <Encabezado
        eyebrow="Finanzas"
        icono="grafica"
        titulo="Reportes"
        descripcion="Ingresos por fletes contra gastos, por semana, camión, destino y piloto"
      />
      <Suspense fallback={<Cargando />}>
        <Contenido searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Contenido({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const { anios, periodo } = await resolverPeriodo(sp);
  const { anio, desde, hasta } = periodo;
  const { semanas, total, pendiente, porCamion, porDestino, porPiloto, porResponsable } =
    await obtenerReporte(periodo);
  const resultado = total.resultado;
  const urlExcel = `/reportes/excel?anio=${anio}&desde=${desde}&hasta=${hasta}`;
  const sinDatos = semanas.length === 0;

  // De mayor a menor, para que el puesto 1 sea quien más pagó.
  const responsables = RESPONSABLES.map((r) => ({
    etiqueta: r.nombre,
    clase: r.clase,
    valor: porResponsable.find((p) => p.etiqueta === r.nombre)?.valor ?? 0,
  })).sort((a, b) => b.valor - a.valor);

  return (
    <>
      <BarraHerramientas>
        <Filtros action="/reportes" boton="Ver reporte">
          <Campo etiqueta="Año" ancho>
            <select name="anio" defaultValue={anio} className={claseInput}>
              {(anios.length ? anios : [anio]).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Desde semana">
            <input name="desde" type="number" min="1" max="53" defaultValue={desde} className={`${claseInput} w-20`} />
          </Campo>
          <Campo etiqueta="Hasta semana">
            <input name="hasta" type="number" min="1" max="53" defaultValue={hasta} className={`${claseInput} w-20`} />
          </Campo>
        </Filtros>
        <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
          {pendiente.viajes > 0 && (
            <p className="inline-flex items-center gap-2 rounded-full bg-alerta-claro px-3 py-1.5 text-xs font-medium text-amber-900 ring-1 ring-amber-300/60 max-sm:w-full max-sm:justify-center">
              <span aria-hidden className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-60" />
                <span className="relative size-2 rounded-full bg-amber-500" />
              </span>
              <span>
                Por entregar: <b className="tabular-nums">{pendiente.viajes}</b> viajes ·{" "}
                <b className="tabular-nums">{formatoQ(pendiente.ingresos)}</b>
              </span>
            </p>
          )}
          <a
            href={urlExcel}
            download
            aria-disabled={sinDatos || undefined}
            tabIndex={sinDatos ? -1 : undefined}
            className={`${claseBotonPrimario} group max-sm:w-full`}
          >
            <Icono nombre="hoja" />
            Descargar Excel
            <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide">XLSX</span>
            <Icono nombre="descargar" className="size-4 opacity-80 transition group-hover:translate-y-0.5" />
          </a>
        </div>
      </BarraHerramientas>

      <Resumen
        datos={[
          {
            etiqueta: "Ingresos",
            valor: formatoQ(total.ingresos),
            icono: "billete",
            nota: `${total.viajes} viajes entregados`,
          },
          {
            etiqueta: "Gastos",
            valor: formatoQ(total.gastos),
            icono: "bomba",
            tono: "acento",
            nota: `Diésel ${formatoQCorto(total.diesel)} · Repuestos ${formatoQCorto(total.repuestos)}`,
          },
          { etiqueta: "Margen", valor: `${total.margen}%`, icono: "porcentaje", progreso: total.margen },
          {
            etiqueta: "Resultado",
            valor: `${resultado < 0 ? "−" : "+"}${formatoQ(Math.abs(resultado))}`,
            icono: resultado < 0 ? "tendenciaBaja" : "tendencia",
            destacado: true,
            nota: "Fletes menos diésel y repuestos",
          },
        ]}
      />

      {sinDatos ? (
        <Tarjeta titulo="Sin datos" icono="grafica">
          <Vacio icono="grafica" titulo="Nada que mostrar">
            No hay viajes entregados ni gastos en este rango.
          </Vacio>
        </Tarjeta>
      ) : (
        <>
          <Tarjeta
            titulo="Ingresos vs gastos por semana"
            icono="grafica"
            extra={
              <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-tenue max-sm:w-full">
                <li className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-[3px] bg-marca" />
                  Ingresos (fletes entregados)
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-[3px] bg-acento" />
                  Gastos (diésel + repuestos)
                </li>
              </ul>
            }
          >
            <GraficaSemanal semanas={semanas} />
            <div className="mt-5 grid grid-cols-1 divide-y divide-borde rounded-xl bg-fondo text-center ring-1 ring-borde ring-inset sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:py-3 [&>div]:max-sm:flex [&>div]:max-sm:items-center [&>div]:max-sm:justify-between [&>div]:max-sm:px-4 [&>div]:max-sm:py-2.5 [&>div>*]:max-sm:mt-0">
              <div className="min-w-0 px-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-tenue">Ingresos</p>
                <p className="mt-0.5 text-base font-semibold tabular-nums text-marca sm:text-lg">
                  {formatoQ(total.ingresos)}
                </p>
              </div>
              <div className="min-w-0 px-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-tenue">Gastos</p>
                <p className="mt-0.5 text-base font-semibold tabular-nums text-acento-oscuro sm:text-lg">
                  {formatoQ(total.gastos)}
                </p>
              </div>
              <div className="min-w-0 px-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-tenue">Resultado</p>
                <div className="mt-0.5">
                  <Resultado valor={resultado} />
                </div>
              </div>
            </div>
          </Tarjeta>

          <Tarjeta titulo="Detalle por semana" icono="hoja" flush>
            <div className="overflow-x-auto scrollbar-thin">
              <table className={`${claseTabla} whitespace-nowrap`}>
                <thead className={claseThead}>
                  <tr>
                    <th>Semana</th>
                    <th className="text-right">Viajes</th>
                    <th className="text-right">Ingresos</th>
                    <th className="text-right">Diésel</th>
                    <th className="text-right">Repuestos</th>
                    <th className="text-right">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {semanas.map((s) => (
                    <tr key={s.semana} className={claseFila}>
                      <td className="font-medium text-tinta">Semana {s.semana}</td>
                      <td className="text-right tabular-nums text-tenue">{s.viajes}</td>
                      <td className="text-right font-medium tabular-nums">{formatoQ(s.ingresos)}</td>
                      <td className="text-right font-medium tabular-nums">{formatoQ(s.diesel)}</td>
                      <td className="text-right font-medium tabular-nums">{formatoQ(s.repuestos)}</td>
                      <td className="text-right">
                        <Resultado valor={s.ingresos - s.diesel - s.repuestos} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={claseTotal}>
                    <td>Total</td>
                    <td className="text-right tabular-nums">{total.viajes}</td>
                    <td className="text-right tabular-nums">{formatoQ(total.ingresos)}</td>
                    <td className="text-right tabular-nums">{formatoQ(total.diesel)}</td>
                    <td className="text-right tabular-nums">{formatoQ(total.repuestos)}</td>
                    <td className="text-right">
                      <Resultado valor={resultado} />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Tarjeta>
        </>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Tarjeta titulo="Ingresos por camión" icono="camion">
          <Ranking
            filas={porCamion.map((c) => ({
              etiqueta: c.etiqueta,
              detalle: `${c.viajes} viajes`,
              valor: c.valor,
            }))}
          />
        </Tarjeta>
        <Tarjeta titulo="Ingresos por destino" icono="pin">
          <Ranking
            filas={porDestino.map((d) => ({
              etiqueta: `${d.destino} / ${d.producto}`,
              detalle: `${d.viajes} viajes`,
              valor: d.valor,
            }))}
          />
        </Tarjeta>
        <Tarjeta titulo="Viajes por piloto" icono="usuario">
          <Ranking
            filas={porPiloto.map((p) => ({
              etiqueta: p.etiqueta,
              detalle: formatoQ(p.valor),
              valor: p.viajes,
            }))}
            formato={(v) => `${v} viajes`}
          />
        </Tarjeta>
        <Tarjeta titulo="Gastos por quién pagó" icono="monedas" tono="acento">
          <Ranking
            filas={responsables.map((r) => ({ etiqueta: r.etiqueta, valor: r.valor, swatch: r.clase }))}
            colores={responsables.map((r) => `${r.clase} ring-1 ring-inset ring-black/10`)}
          />
        </Tarjeta>
      </div>
    </>
  );
}

// Techo "redondo" del eje Y: 1, 2, 2.5 o 5 por potencia de 10.
function techoBonito(v: number) {
  const m = 10 ** Math.floor(Math.log10(Math.max(v, 1)));
  return ([1, 2, 2.5, 5, 10].find((p) => p * m >= v) ?? 10) * m;
}

const MARCAS = [1, 0.75, 0.5, 0.25, 0];

function GraficaSemanal({ semanas }: { semanas: Semana[] }) {
  const series = semanas.map((s) => {
    const gastos = s.diesel + s.repuestos;
    return { ...s, gastos, resultado: s.ingresos - gastos };
  });
  const tope = techoBonito(Math.max(1, ...series.flatMap((s) => [s.ingresos, s.gastos])));
  const pct = (v: number) => `${(v / tope) * 100}%`;
  const firmado = (v: number) => `${v < 0 ? "−" : "+"}${formatoQ(Math.abs(v))}`;
  const barra =
    "w-3 origin-bottom rounded-t-[4px] transition-[height] duration-500 ease-out animate-crecer sm:w-4 lg:w-5";

  return (
    <div className="flex gap-2">
      {/* Eje Y fuera del scroll; cada etiqueta alineada con su línea. */}
      <div aria-hidden className="relative h-64 w-12 shrink-0 pb-7 sm:h-72">
        <div className="relative h-full">
          {MARCAS.map((f) => (
            <span
              key={f}
              className="absolute right-1 -translate-y-1/2 text-[11px] tabular-nums text-tenue"
              style={{ top: `${(1 - f) * 100}%` }}
            >
              {formatoQCorto(tope * f)}
            </span>
          ))}
        </div>
      </div>

      <div className="relative min-w-0 flex-1">
        {/* Las líneas y el detalle se posicionan respecto a esta caja (fuera del scroll) para que no se recorten. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[calc(16rem-1.75rem)] sm:h-[calc(18rem-1.75rem)]">
          {MARCAS.map((f) => (
            <div
              key={f}
              className={`absolute inset-x-0 border-t ${f === 0 ? "border-solid border-borde-fuerte" : "border-dashed border-borde"}`}
              style={{ top: `${(1 - f) * 100}%` }}
            />
          ))}
        </div>
        <div className="snap-x overflow-x-auto scrollbar-thin">
          <div
            role="list"
            aria-label="Ingresos y gastos por semana"
            className="flex h-64 items-end gap-1 sm:h-72 sm:gap-3 [&:has(.col:focus-visible)_.col:not(:focus-visible)]:opacity-40 [&:has(.col:hover)_.col:not(:hover)]:opacity-40"
            style={{ minWidth: `${series.length * 52}px` }}
          >
            {series.map((s, i) => (
              <div
                key={s.semana}
                role="listitem"
                tabIndex={0}
                aria-label={`Semana ${s.semana}: ingresos ${formatoQ(s.ingresos)}, gastos ${formatoQ(s.gastos)}, resultado ${firmado(s.resultado)}`}
                className="col group flex h-full flex-1 snap-start flex-col justify-end outline-none transition-opacity"
              >
                <div className="flex min-h-0 flex-1 items-end justify-center gap-[2px] rounded-lg px-1 transition group-hover:bg-slate-100/80 group-focus-visible:bg-slate-100/80 group-focus-visible:ring-2 group-focus-visible:ring-marca">
                  <div
                    className={`${barra} bg-marca ${s.ingresos > 0 ? "min-h-[2px]" : ""}`}
                    style={{ height: pct(s.ingresos), animationDelay: `${i * 40}ms` }}
                  />
                  <div
                    className={`${barra} bg-acento ${s.gastos > 0 ? "min-h-[2px]" : ""}`}
                    style={{ height: pct(s.gastos), animationDelay: `${i * 40 + 20}ms` }}
                  />
                </div>
                <span
                  aria-hidden
                  className="h-7 shrink-0 pt-1.5 text-center text-[11px] tabular-nums text-tenue group-hover:font-semibold group-hover:text-tinta group-focus-visible:font-semibold group-focus-visible:text-tinta"
                >
                  S{s.semana}
                </span>
                {/* Del lado contrario a la columna para no taparla. */}
                <div
                  aria-hidden
                  className={`pointer-events-none absolute top-1 z-20 w-52 max-w-[calc(100%-0.5rem)] translate-y-1 rounded-xl bg-tinta/95 p-3 text-xs text-white opacity-0 shadow-elevada ring-1 ring-white/10 backdrop-blur transition group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100 ${
                    i < series.length / 2 ? "right-1" : "left-1"
                  }`}
                >
                  <p className="mb-2 font-display text-sm font-semibold uppercase tracking-wide">Semana {s.semana}</p>
                  <div className="space-y-1">
                    <FilaTooltip color="bg-marca" etiqueta="Ingresos" valor={s.ingresos} />
                    <FilaTooltip color="bg-acento" etiqueta="Gastos" valor={s.gastos} />
                    <p className="flex justify-between gap-3 pl-4 text-slate-400">
                      <span>Diésel</span>
                      <span className="tabular-nums">{formatoQ(s.diesel)}</span>
                    </p>
                    <p className="flex justify-between gap-3 pl-4 text-slate-400">
                      <span>Repuestos</span>
                      <span className="tabular-nums">{formatoQ(s.repuestos)}</span>
                    </p>
                  </div>
                  <p className="mt-2 flex items-center justify-between gap-3 border-t border-white/15 pt-2">
                    <span className="text-plata">Resultado</span>
                    <Resultado valor={s.resultado} oscuro />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l from-superficie sm:hidden"
        />
      </div>
    </div>
  );
}

function FilaTooltip({ color, etiqueta, valor }: { color: string; etiqueta: string; valor: number }) {
  return (
    <p className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-1.5 text-plata">
        <span className={`size-2.5 rounded-[3px] ${color}`} />
        {etiqueta}
      </span>
      <span className="font-semibold tabular-nums">{formatoQ(valor)}</span>
    </p>
  );
}

function Ranking({
  filas,
  formato = formatoQ,
  colores,
}: {
  filas: { etiqueta: string; detalle?: string; valor: number; swatch?: string }[];
  formato?: (v: number) => string;
  /** Clase de la barra por fila, en el mismo orden que `filas`. */
  colores?: string[];
}) {
  if (filas.length === 0) return <Vacio icono="medalla">Sin datos en este rango.</Vacio>;
  const tope = Math.max(1, ...filas.map((f) => f.valor));
  return (
    <ol className="space-y-3.5">
      {filas.map((f, i) => (
        <li
          key={f.etiqueta}
          className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-x-3 gap-y-1.5 animate-entrada"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <span
            className={`grid size-6 place-items-center rounded-md text-xs font-bold tabular-nums ${i === 0 ? "bg-acento text-white" : "bg-slate-100 text-tenue"}`}
          >
            {i + 1}
          </span>
          <span className="min-w-0 truncate text-sm font-medium text-tinta">
            {f.swatch && <span aria-hidden className={`mr-2 inline-block size-3 rounded align-[-1px] ${f.swatch}`} />}
            {f.etiqueta}
            {f.detalle && <span className="ml-2 text-xs font-normal text-tenue">{f.detalle}</span>}
          </span>
          <span className="text-sm font-semibold tabular-nums text-tinta">{formato(f.valor)}</span>
          <div className="col-span-2 col-start-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full origin-left rounded-full animate-crecer-x ${colores?.[i] ?? (i === 0 ? "bg-marca" : "bg-marca/60")}`}
              style={{ width: `${(f.valor / tope) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
