import { io } from "next/cache";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { RESPONSABLES } from "@/lib/constantes";
import type { Params } from "@/lib/filtros";
import { formatoQ, formatoQCorto, cantidad } from "@/lib/formato";
import { obtenerReporte, resolverPeriodo, type Semana } from "@/lib/reporte";
import {
  BarraHerramientas,
  Campo,
  Cargando,
  claseBotonPrimario,
  claseBotonSecundario,
  claseContenedorTabla,
  claseFila,
  claseInput,
  claseTabla,
  claseTarjetaMovil,
  claseThead,
  claseTotal,
  Encabezado,
  Filtros,
  Icono,
  Insignia,
  Pastilla,
  Placa,
  Resultado,
  Resumen,
  Tarjeta,
  TotalMovil,
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

const firmado = (v: number) => `${v < 0 ? "−" : v > 0 ? "+" : ""}${formatoQ(Math.abs(v))}`;
const pctMargen = (resultado: number, ingresos: number) =>
  ingresos ? Math.round((resultado / ingresos) * 100) : null;

async function Contenido({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  // La fecha de hoy se lee por visita, no en el prerender (Cache Components).
  await io();
  const { anios, periodo } = await resolverPeriodo(sp);
  const { anio, desde, hasta } = periodo;
  const { semanas, total, pendiente, porCamion, porDestino, porPiloto, porResponsable } =
    await obtenerReporte(periodo);
  const resultado = total.resultado;
  const urlExcel = `/reportes/excel?anio=${anio}&desde=${desde}&hasta=${hasta}`;
  const sinDatos = semanas.length === 0;
  const rango = desde === hasta ? `Semana ${desde}` : `Semanas ${desde}–${hasta}`;

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
            <select name="anio" defaultValue={anio} className={`${claseInput} sm:w-28`}>
              {(anios.length ? anios : [anio]).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Desde semana">
            <input
              name="desde"
              type="number"
              inputMode="numeric"
              min="1"
              max="53"
              defaultValue={desde}
              className={`${claseInput} sm:w-24`}
            />
          </Campo>
          <Campo etiqueta="Hasta semana">
            <input
              name="hasta"
              type="number"
              inputMode="numeric"
              min="1"
              max="53"
              defaultValue={hasta}
              className={`${claseInput} sm:w-24`}
            />
          </Campo>
        </Filtros>
        <BotonExcel url={urlExcel} deshabilitado={sinDatos} />
      </BarraHerramientas>

      {/* Contexto del periodo: qué se está viendo y qué falta por cobrar. */}
      <div className="-mt-2 flex flex-wrap items-center gap-2">
        <Insignia tono="marca" icono="calendario">
          {anio} · {rango}
        </Insignia>
        {!sinDatos && (
          <Insignia tono="neutro">{cantidad(semanas.length, "semana con movimiento", "semanas con movimiento")}</Insignia>
        )}
        {pendiente.viajes > 0 && (
          <Insignia tono="alerta" icono="reloj">
            Por entregar: <b className="font-semibold tabular-nums">{cantidad(pendiente.viajes, "viaje", "viajes")}</b> ·{" "}
            <b className="font-semibold tabular-nums">{formatoQ(pendiente.ingresos)}</b>
          </Insignia>
        )}
      </div>

      <Resumen
        datos={[
          {
            etiqueta: "Ingresos",
            valor: formatoQ(total.ingresos),
            icono: "billete",
            nota: cantidad(total.viajes, "viaje entregado", "viajes entregados"),
          },
          {
            etiqueta: "Gastos",
            valor: formatoQ(total.gastos),
            icono: "bomba",
            tono: "acento",
            nota: `Diésel ${formatoQCorto(total.diesel)} · Repuestos ${formatoQCorto(total.repuestos)}`,
          },
          {
            etiqueta: "Margen",
            valor: `${total.margen}%`,
            icono: "porcentaje",
            tono: total.ingresos === 0 ? "neutro" : total.margen < 0 ? "peligro" : "exito",
            nota: total.ingresos === 0 ? "Sin ingresos en el rango" : "Resultado sobre ingresos",
            progreso: total.margen,
          },
          {
            etiqueta: "Resultado",
            valor: firmado(resultado),
            icono: resultado < 0 ? "tendenciaBaja" : "tendencia",
            destacado: true,
            nota: "Fletes menos diésel y repuestos",
          },
        ]}
      />

      {sinDatos ? (
        <section className="relative overflow-hidden rounded-tarjeta bg-superficie shadow-tarjeta ring-1 ring-borde">
          <div aria-hidden className="franja-marca h-1" />
          <Vacio
            icono="grafica"
            titulo="Sin movimiento en este periodo"
            accion={
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/viajes" className={claseBotonSecundario}>
                  <Icono nombre="camion" />
                  Ir a viajes
                </Link>
                <Link href="/gastos" className={claseBotonSecundario}>
                  <Icono nombre="bomba" />
                  Ir a diésel y gastos
                </Link>
              </div>
            }
          >
            No hay viajes entregados ni gastos {desde === hasta ? `en la semana ${desde}` : `entre las semanas ${desde} y ${hasta}`} de {anio}. Prueba otro rango de
            semanas o registra movimientos para ver la gráfica, los rankings y el detalle.
          </Vacio>
        </section>
      ) : (
        <>
          <TarjetaGrafica semanas={semanas} ingresos={total.ingresos} gastos={total.gastos} resultado={resultado} />

          <DetalleSemanas semanas={semanas} total={total} />

          <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
            <Tarjeta
              titulo="Ingresos por camión"
              icono="camion"
              extra={<Pastilla>{porCamion.length}</Pastilla>}
            >
              <Ranking
                filas={porCamion.map((c) => ({
                  etiqueta: c.etiqueta,
                  placa: true,
                  detalle: cantidad(c.viajes, "viaje", "viajes"),
                  valor: c.valor,
                }))}
              />
            </Tarjeta>
            <Tarjeta
              titulo="Ingresos por destino"
              icono="pin"
              extra={<Pastilla>{porDestino.length}</Pastilla>}
            >
              <Ranking
                filas={porDestino.map((d) => ({
                  etiqueta: d.destino,
                  detalle: `${d.producto} · ${cantidad(d.viajes, "viaje", "viajes")}`,
                  valor: d.valor,
                }))}
              />
            </Tarjeta>
            <Tarjeta
              titulo="Viajes por piloto"
              icono="usuario"
              extra={<Pastilla>{porPiloto.length}</Pastilla>}
            >
              <Ranking
                filas={porPiloto.map((p) => ({
                  etiqueta: p.etiqueta,
                  detalle: `${formatoQ(p.valor)} en fletes`,
                  valor: p.viajes,
                }))}
                formato={(v) => cantidad(v, "viaje", "viajes")}
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
      )}
    </>
  );
}

function BotonExcel({ url, deshabilitado }: { url: string; deshabilitado: boolean }) {
  return (
    <div className="flex flex-col items-stretch gap-1.5 max-sm:w-full sm:items-end">
      <a
        href={url}
        download
        aria-disabled={deshabilitado || undefined}
        tabIndex={deshabilitado ? -1 : undefined}
        aria-label="Descargar reporte en Excel (XLSX)"
        className={`${claseBotonPrimario} group gap-2.5 sm:h-10 sm:px-4`}
      >
        <Icono nombre="hoja" />
        Descargar Excel
        <span className="rounded-[5px] bg-white/18 px-1.5 py-0.5 text-[10px] leading-3 font-bold tracking-[0.06em] ring-1 ring-white/25 ring-inset group-aria-disabled:bg-white group-aria-disabled:ring-borde">
          XLSX
        </span>
        <Icono
          nombre="descargar"
          className="size-4 opacity-80 transition-transform group-hover:translate-y-0.5"
        />
      </a>
      <span className="text-center text-[11px] leading-4 text-tenue sm:text-right">
        {deshabilitado ? "Sin datos para exportar en este rango" : "Exporta el rango seleccionado"}
      </span>
    </div>
  );
}

// ——— Gráfica semanal ———

// Techo "redondo" del eje Y: 1, 2, 2.5 o 5 por potencia de 10.
function techoBonito(v: number) {
  const m = 10 ** Math.floor(Math.log10(Math.max(v, 1)));
  return ([1, 2, 2.5, 5, 10].find((p) => p * m >= v) ?? 10) * m;
}

const MARCAS = [1, 0.75, 0.5, 0.25, 0];

function TarjetaGrafica({
  semanas,
  ingresos,
  gastos,
  resultado,
}: {
  semanas: Semana[];
  ingresos: number;
  gastos: number;
  resultado: number;
}) {
  const resultados = semanas.map((s) => ({ semana: s.semana, r: s.ingresos - s.diesel - s.repuestos }));
  const mejor = resultados.reduce((a, b) => (b.r > a.r ? b : a));
  const promedio = resultado / semanas.length;

  return (
    <Tarjeta
      titulo="Ingresos vs gastos por semana"
      descripcion={
        semanas.length > 1
          ? `Mejor semana: S${mejor.semana} (${firmado(mejor.r)})`
          : `Semana ${semanas[0].semana}`
      }
      icono="grafica"
      pie={
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <DatoPie etiqueta="Ingresos" punto="bg-marca">
            <span className="text-tinta">{formatoQ(ingresos)}</span>
          </DatoPie>
          <DatoPie etiqueta="Gastos" punto="bg-acento">
            <span className="text-tinta">{formatoQ(gastos)}</span>
          </DatoPie>
          <DatoPie etiqueta="Resultado">
            <span className={resultado < 0 ? "text-peligro" : "text-exito"}>{firmado(resultado)}</span>
          </DatoPie>
          <DatoPie etiqueta="Promedio semanal">
            <span className={promedio < 0 ? "text-peligro" : "text-exito"}>{firmado(Math.round(promedio * 100) / 100)}</span>
          </DatoPie>
        </dl>
      }
    >
      <ul
        aria-label="Leyenda"
        className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-tinta sm:mb-5"
      >
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-[3px] bg-marca" />
          Ingresos <span className="text-tenue max-sm:hidden">· fletes entregados</span>
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-[3px] bg-acento" />
          Gastos <span className="text-tenue max-sm:hidden">· diésel + repuestos</span>
        </li>
        <li className="inline-flex items-center gap-1.5 text-tenue">
          <span aria-hidden className="text-[9px] font-bold">
            <span className="text-exito">▲</span>
            <span className="text-peligro">▼</span>
          </span>
          Ganó / perdió
        </li>
      </ul>
      <GraficaSemanal semanas={semanas} />
      <p className="mt-3 flex items-center gap-1.5 text-xs text-tenue sm:hidden">
        <Icono nombre="info" className="size-3.5 shrink-0" />
        Toca una semana para ver el detalle; desliza si hay más.
      </p>
    </Tarjeta>
  );
}

function DatoPie({ etiqueta, punto, children }: { etiqueta: string; punto?: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-eyebrow font-semibold uppercase tracking-[0.1em] text-tenue">
        {punto && <span aria-hidden className={`size-2 rounded-[2px] ${punto}`} />}
        {etiqueta}
      </dt>
      <dd className="mt-0.5 truncate text-base font-semibold tabular-nums sm:text-lg">{children}</dd>
    </div>
  );
}

function GraficaSemanal({ semanas }: { semanas: Semana[] }) {
  const series = semanas.map((s) => {
    const gastos = s.diesel + s.repuestos;
    return { ...s, gastos, resultado: s.ingresos - gastos };
  });
  const tope = techoBonito(Math.max(1, ...series.flatMap((s) => [s.ingresos, s.gastos])));
  const pct = (v: number) => `${(v / tope) * 100}%`;
  const barra =
    "w-3 origin-bottom rounded-t-[5px] transition-[height,filter] duration-500 ease-out animate-crecer group-hover:brightness-110 sm:w-4 lg:w-6";

  return (
    <div className="flex gap-2 sm:gap-3">
      {/* Eje Y fuera del scroll; cada etiqueta alineada con su línea. */}
      <div aria-hidden className="relative h-64 w-11 shrink-0 pb-8 sm:h-72 sm:w-14 lg:h-80">
        <div className="relative h-full">
          {MARCAS.map((f) => (
            <span
              key={f}
              className="absolute right-0 -translate-y-1/2 text-[11px] font-medium whitespace-nowrap tabular-nums text-tenue"
              style={{ top: `${(1 - f) * 100}%` }}
            >
              {f === 0 ? "Q0" : formatoQCorto(tope * f)}
            </span>
          ))}
        </div>
      </div>

      <div className="relative min-w-0 flex-1">
        {/* Las líneas y el detalle se posicionan respecto a esta caja (fuera del scroll) para que no se recorten. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[calc(16rem-2rem)] sm:h-[calc(18rem-2rem)] lg:h-[calc(20rem-2rem)]"
        >
          {MARCAS.map((f) => (
            <div
              key={f}
              className={`absolute inset-x-0 border-t ${f === 0 ? "border-borde-fuerte" : "border-dashed border-borde"}`}
              style={{ top: `${(1 - f) * 100}%` }}
            />
          ))}
        </div>
        <div className="snap-x overflow-x-auto scrollbar-thin">
          <div
            role="list"
            aria-label="Ingresos y gastos por semana"
            className="flex h-64 items-end justify-around gap-1 sm:h-72 sm:gap-2 lg:h-80 [&:has(.col:focus-visible)_.col:not(:focus-visible)]:opacity-45 [@media(hover:hover)]:[&:has(.col:hover)_.col:not(:hover)]:opacity-45"
            style={{ minWidth: `${series.length * 48}px` }}
          >
            {series.map((s, i) => (
              <div
                key={s.semana}
                role="listitem"
                tabIndex={0}
                aria-label={`Semana ${s.semana}: ingresos ${formatoQ(s.ingresos)}, gastos ${formatoQ(s.gastos)}, resultado ${firmado(s.resultado)}`}
                className="col group flex h-full max-w-24 flex-1 snap-start flex-col justify-end outline-none transition-opacity duration-150"
              >
                <div className="flex min-h-0 flex-1 items-end justify-center gap-[3px] rounded-t-lg px-1 transition-colors group-hover:bg-marca-50 group-focus-visible:bg-marca-50 group-focus-visible:ring-2 group-focus-visible:ring-marca">
                  <div
                    className={`${barra} bg-linear-to-t from-marca to-blue-500 ${s.ingresos > 0 ? "min-h-[2px]" : ""}`}
                    style={{ height: pct(s.ingresos), animationDelay: `${i * 35}ms` }}
                  />
                  <div
                    className={`${barra} bg-linear-to-t from-acento-oscuro to-acento ${s.gastos > 0 ? "min-h-[2px]" : ""}`}
                    style={{ height: pct(s.gastos), animationDelay: `${i * 35 + 20}ms` }}
                  />
                </div>
                <span
                  aria-hidden
                  className="flex h-8 shrink-0 flex-col items-center pt-1.5 text-[11px] leading-3.5 tabular-nums text-tenue group-hover:text-tinta group-focus-visible:text-tinta"
                >
                  <span className="font-medium group-hover:font-semibold">S{s.semana}</span>
                  {/* Punto de resultado: con forma distinta además del color. */}
                  <span
                    className={`mt-1 text-[9px] leading-none font-bold ${s.resultado < 0 ? "text-peligro" : "text-exito"}`}
                  >
                    {s.resultado < 0 ? "▼" : "▲"}
                  </span>
                </span>
                {/* Del lado contrario a la columna para no taparla. */}
                <div
                  aria-hidden
                  className={`pointer-events-none absolute top-1 z-20 w-56 max-w-[calc(100%-0.5rem)] translate-y-1 overflow-hidden rounded-interno bg-cabina-2/95 p-3.5 text-xs text-white opacity-0 shadow-elevada ring-1 ring-white/10 backdrop-blur transition group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100 ${
                    i < series.length / 2 ? "right-1" : "left-1"
                  }`}
                >
                  <div className="mb-2.5 flex items-baseline justify-between gap-2">
                    <p className="font-display text-base font-semibold tracking-tight">Semana {s.semana}</p>
                    <p className="text-[11px] text-plata">{cantidad(s.viajes, "viaje", "viajes")}</p>
                  </div>
                  <div className="space-y-1.5">
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
                  <p className="mt-2.5 flex items-center justify-between gap-3 border-t border-white/15 pt-2.5">
                    <span className="text-plata">Resultado</span>
                    <Resultado valor={s.resultado} oscuro />
                  </p>
                  <span className="franja-marca absolute inset-x-0 bottom-0 h-0.5" />
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
      <span className="inline-flex items-center gap-1.5 text-plata-claro">
        <span className={`size-2.5 rounded-[3px] ${color}`} />
        {etiqueta}
      </span>
      <span className="font-semibold tabular-nums">{formatoQ(valor)}</span>
    </p>
  );
}

// ——— Detalle por semana: tarjetas en celular, tabla en md+ ———

type Totales = { viajes: number; ingresos: number; diesel: number; repuestos: number; resultado: number; margen: number };

function Margen({ valor }: { valor: number | null }) {
  if (valor === null) return <span className="text-suave">—</span>;
  return <span className={valor < 0 ? "text-peligro" : "text-tinta"}>{valor}%</span>;
}

function TarjetaSemana({ s }: { s: Semana }) {
  const r = s.ingresos - s.diesel - s.repuestos;
  return (
    <li className={`${claseTarjetaMovil} border-l-4 p-3 ${r < 0 ? "border-l-peligro" : "border-l-exito"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base leading-5 font-semibold tracking-tight text-tinta">Semana {s.semana}</p>
          <p className="text-xs text-tenue">
            {cantidad(s.viajes, "viaje", "viajes")} · margen <Margen valor={pctMargen(r, s.ingresos)} />
          </p>
        </div>
        <Resultado valor={r} />
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-2 border-t border-borde pt-2">
        {(
          [
            ["Ingresos", s.ingresos],
            ["Diésel", s.diesel],
            ["Repuestos", s.repuestos],
          ] as const
        ).map(([e, v]) => (
          <div key={e} className="min-w-0">
            <dt className="text-eyebrow font-semibold uppercase tracking-[0.08em] text-tenue">{e}</dt>
            <dd className="truncate text-[13px] font-semibold tabular-nums text-tinta">{formatoQ(v)}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
}

function DetalleSemanas({ semanas, total }: { semanas: Semana[]; total: Totales }) {
  return (
    <Tarjeta
      titulo="Detalle por semana"
      icono="hoja"
      extra={<Pastilla tono="marca">{cantidad(semanas.length, "semana", "semanas")}</Pastilla>}
      flush
    >
      {/* Celular */}
      <ol className="space-y-2 bg-fondo/60 p-3 sm:p-4 md:hidden">
        {semanas.map((s) => (
          <TarjetaSemana key={s.semana} s={s} />
        ))}
        <li className="pt-0.5">
          <TotalMovil etiqueta={`Total · ${cantidad(total.viajes, "viaje", "viajes")}`} valor={firmado(total.resultado)} />
        </li>
      </ol>

      {/* md+ */}
      <div className={`${claseContenedorTabla} max-h-[75vh] max-md:hidden`}>
        <table className={`${claseTabla} whitespace-nowrap`}>
          <thead className={`${claseThead} sticky top-0 z-10 [&_th]:bg-fondo`}>
            <tr>
              <th>Semana</th>
              <th className="text-right">Viajes</th>
              <th className="text-right">Ingresos</th>
              <th className="text-right">Diésel</th>
              <th className="text-right">Repuestos</th>
              <th className="text-right">Margen</th>
              <th className="text-right">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {semanas.map((s) => {
              const r = s.ingresos - s.diesel - s.repuestos;
              return (
                <tr key={s.semana} className={claseFila}>
                  <td>
                    <span className="inline-flex items-center gap-2.5 font-medium text-tinta">
                      <span className="grid h-6 min-w-8 place-items-center rounded-md bg-fondo-2 px-1.5 text-xs font-semibold tabular-nums text-tenue ring-1 ring-borde ring-inset">
                        S{s.semana}
                      </span>
                      Semana {s.semana}
                    </span>
                  </td>
                  <td className="text-right tabular-nums text-tenue">{s.viajes}</td>
                  <td className="text-right font-medium tabular-nums text-tinta">{formatoQ(s.ingresos)}</td>
                  <td className="text-right tabular-nums text-tenue">{formatoQ(s.diesel)}</td>
                  <td className="text-right tabular-nums text-tenue">{formatoQ(s.repuestos)}</td>
                  <td className="text-right tabular-nums">
                    <Margen valor={pctMargen(r, s.ingresos)} />
                  </td>
                  <td className="text-right">
                    <Resultado valor={r} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 z-10">
            <tr className={`${claseTotal} text-base`}>
              <td>Total</td>
              <td className="text-right">{total.viajes}</td>
              <td className="text-right">{formatoQ(total.ingresos)}</td>
              <td className="text-right">{formatoQ(total.diesel)}</td>
              <td className="text-right">{formatoQ(total.repuestos)}</td>
              <td className="text-right">
                <Margen valor={total.ingresos ? total.margen : null} />
              </td>
              <td className="text-right">
                <Resultado valor={total.resultado} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Tarjeta>
  );
}

// ——— Rankings ———

const MEDALLA = [
  "bg-linear-to-b from-amber-300 to-amber-500 text-amber-950 ring-amber-600/30",
  "bg-linear-to-b from-slate-200 to-slate-400 text-slate-900 ring-slate-500/30",
  "bg-linear-to-b from-orange-200 to-orange-400 text-orange-950 ring-orange-600/30",
];

function Ranking({
  filas,
  formato = formatoQ,
  colores,
}: {
  filas: { etiqueta: string; detalle?: string; valor: number; swatch?: string; placa?: boolean }[];
  formato?: (v: number) => string;
  /** Clase de la barra por fila, en el mismo orden que `filas`. */
  colores?: string[];
}) {
  const suma = filas.reduce((t, f) => t + f.valor, 0);
  if (filas.length === 0 || suma === 0) return <Vacio icono="medalla">Sin datos en este rango.</Vacio>;
  const tope = Math.max(1, ...filas.map((f) => f.valor));
  return (
    <ol className="-my-1 divide-y divide-borde/70">
      {filas.map((f, i) => {
        const parte = Math.round((f.valor / suma) * 100);
        return (
          <li
            key={f.etiqueta}
            className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-x-3 py-3 animate-entrada"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span
              aria-label={`Puesto ${i + 1}`}
              className={`grid size-7 place-items-center rounded-lg text-xs font-bold tabular-nums ring-1 ring-inset ${
                i < 3 && f.valor > 0 ? MEDALLA[i] : "bg-fondo-2 text-tenue ring-borde"
              }`}
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-tinta">
                {f.swatch && <span aria-hidden className={`size-3 shrink-0 rounded ring-1 ring-black/10 ${f.swatch}`} />}
                {f.placa ? (
<Placa placa={f.etiqueta} />
                ) : (
                  <span className="line-clamp-2 wrap-break-word">{f.etiqueta}</span>
                )}
              </p>
              {f.detalle && <p className="mt-0.5 truncate text-xs text-tenue">{f.detalle}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold whitespace-nowrap tabular-nums text-tinta">{formato(f.valor)}</p>
              <p className="text-[11px] tabular-nums text-tenue">{parte}%</p>
            </div>
            <div className="col-span-2 col-start-2 mt-2 h-1.5 overflow-hidden rounded-full bg-fondo-2">
              <div
                className={`h-full origin-left rounded-full animate-crecer-x ${colores?.[i] ?? (i === 0 ? "bg-marca" : "bg-marca/55")}`}
                style={{ width: `${(f.valor / tope) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
