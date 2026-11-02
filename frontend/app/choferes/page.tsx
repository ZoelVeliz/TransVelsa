import { and, asc, between, count, desc, eq, max, min } from "drizzle-orm";
import { Suspense, type ReactNode } from "react";
import {
  actualizarMontoTarifa,
  borrarMovimiento,
  borrarTarifa,
  crearCamion,
  crearMovimiento,
  crearPiloto,
  crearTarifa,
} from "@/lib/acciones";
import { TIPOS_MOVIMIENTO } from "@/lib/constantes";
import {
  camiones,
  db,
  movimientosPiloto,
  pilotos,
  tarifas,
  viajes,
} from "@/lib/db";
import { paramNumero, type Params } from "@/lib/filtros";
import { calcularLiquidacion } from "@/lib/liquidacion";
import { anioSemana, formatoFecha, formatoQ, hoyISO } from "@/lib/formato";
import {
  BotonBorrar,
  Formulario,
  MontoEditable,
} from "@/components/interactivos";
import {
  Avatar,
  Campo,
  Cargando,
  claseFila,
  claseInput,
  claseTabla,
  claseThead,
  Encabezado,
  Filtros,
  Icono,
  Nota,
  PanelAlta,
  Pastilla,
  Placa,
  Tarjeta,
  Vacio,
} from "@/components/ui";

export default function Page(props: PageProps<"/choferes">) {
  return (
    <div className="space-y-6 animate-entrada">
      <Encabezado
        eyebrow="Personal y flota"
        icono="usuarios"
        titulo="Tarifario y choferes"
        descripcion="Liquidación de pilotos, tarifas por destino y flota"
      />
      <Suspense fallback={<Cargando />}>
        <Contenido searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

// Input de monto con prefijo "Q" dentro del campo.
function EntradaQ({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-flex">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-tenue">Q</span>
      {children}
    </span>
  );
}

async function Contenido({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;

  // Por defecto se liquida el rango de semanas con viajes del año más reciente.
  const [rangoDatos] = await db
    .select({ anio: max(viajes.anio) })
    .from(viajes);
  const anio = paramNumero(sp, "anio") ?? rangoDatos?.anio ?? anioSemana(hoyISO()).anio;
  const [rangoAnio] = await db
    .select({ desde: min(viajes.semana), hasta: max(viajes.semana) })
    .from(viajes)
    .where(eq(viajes.anio, anio));
  const actual = anioSemana(hoyISO()).semana;
  const desde = paramNumero(sp, "desde") ?? rangoAnio?.desde ?? actual;
  const hasta = paramNumero(sp, "hasta") ?? rangoAnio?.hasta ?? actual;

  const [listaPilotos, listaCamiones, listaTarifas, viajesPorPiloto, movimientos] =
    await Promise.all([
      db.select().from(pilotos).orderBy(asc(pilotos.nombre)),
      db.select().from(camiones).orderBy(asc(camiones.placa)),
      db.select().from(tarifas).orderBy(asc(tarifas.destino), asc(tarifas.producto)),
      db
        .select({ pilotoId: viajes.pilotoId, viajes: count() })
        .from(viajes)
        .where(
          and(
            eq(viajes.anio, anio),
            between(viajes.semana, desde, hasta),
            eq(viajes.estatus, "Entregado"),
          ),
        )
        .groupBy(viajes.pilotoId),
      db
        .select()
        .from(movimientosPiloto)
        .where(
          and(
            eq(movimientosPiloto.anio, anio),
            between(movimientosPiloto.semana, desde, hasta),
          ),
        )
        .orderBy(desc(movimientosPiloto.fecha)),
    ]);

  const pilotosActivos = listaPilotos.filter((p) => p.activo);

  return (
    <>
      <Tarjeta
        titulo="Liquidación de pilotos"
        icono="billetera"
        acciones={
          <Filtros action="/choferes" boton="Calcular">
            <Campo etiqueta="Año" ancho>
              <input name="anio" type="number" defaultValue={anio} className={`${claseInput} w-20`} />
            </Campo>
            <Campo etiqueta="Desde semana">
              <input name="desde" type="number" min="1" max="53" defaultValue={desde} className={`${claseInput} w-20`} />
            </Campo>
            <Campo etiqueta="Hasta semana">
              <input name="hasta" type="number" min="1" max="53" defaultValue={hasta} className={`${claseInput} w-20`} />
            </Campo>
          </Filtros>
        }
      >
        <div className="mb-4">
          <Nota>
            Año {anio}, semanas {desde} a {hasta}. Solo cuentan los viajes{" "}
            <b>Entregados</b>; adelantos y préstamos se descuentan según su fecha.
          </Nota>
        </div>
        {pilotosActivos.length === 0 ? (
          <Vacio icono="usuarios" titulo="Sin pilotos activos">
            Agrega pilotos en la sección de abajo para calcular su liquidación.
          </Vacio>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {pilotosActivos.map((p) => (
              <Liquidacion
                key={p.id}
                piloto={p}
                cantidadViajes={
                  viajesPorPiloto.find((v) => v.pilotoId === p.id)?.viajes ?? 0
                }
                movimientos={movimientos.filter((m) => m.pilotoId === p.id)}
              />
            ))}
          </div>
        )}
        {listaPilotos.length > 0 && (
          <div className="mt-6 border-t border-dashed border-borde pt-5">
            <PanelAlta titulo="Registrar adelanto o préstamo">
              <Formulario accion={crearMovimiento} textoBoton="Registrar">
                <Campo etiqueta="Piloto">
                  <select name="pilotoId" className={claseInput}>
                    {listaPilotos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </Campo>
                <Campo etiqueta="Tipo">
                  <select name="tipo" className={claseInput}>
                    {TIPOS_MOVIMIENTO.map((t) => (
                      <option key={t} value={t}>
                        {t === "Adelanto" ? "Adelanto de viático" : "Préstamo"}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo etiqueta="Fecha">
                  <input name="fecha" type="date" required defaultValue={hoyISO()} className={claseInput} />
                </Campo>
                <Campo etiqueta="Monto (Q)">
                  <EntradaQ>
                    <input
                      name="monto"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      className={`${claseInput} w-32 pl-7 max-sm:w-full`}
                    />
                  </EntradaQ>
                </Campo>
                <Campo etiqueta="Nota" ancho>
                  <input name="descripcion" placeholder="Opcional" className={`${claseInput} w-48`} />
                </Campo>
              </Formulario>
            </PanelAlta>
          </div>
        )}
      </Tarjeta>

      <div className="grid gap-6 xl:grid-cols-2">
        <Tarjeta
          titulo="Tarifario"
          icono="pin"
          flush
          extra={listaTarifas.length > 0 ? <Pastilla>{listaTarifas.length}</Pastilla> : undefined}
        >
          {listaTarifas.length === 0 ? (
            <Vacio icono="pin">Sin tarifas registradas.</Vacio>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className={claseTabla}>
                <thead className={claseThead}>
                  <tr>
                    <th>Destino</th>
                    <th>Producto</th>
                    <th className="text-right">Tarifa flete</th>
                    <th className="w-10">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {listaTarifas.map((t) => (
                    <tr key={t.id} className={claseFila}>
                      <td>
                        <span className="inline-flex items-center gap-2 font-medium text-tinta">
                          <Icono nombre="pin" className="size-3.5 shrink-0 text-suave" />
                          {t.destino}
                        </span>
                      </td>
                      <td className="text-tenue">{t.producto}</td>
                      <td className="text-right">
                        <MontoEditable
                          monto={t.monto}
                          accion={actualizarMontoTarifa.bind(null, t.id)}
                        />
                      </td>
                      <td className="w-10 text-right">
                        <BotonBorrar accion={borrarTarifa.bind(null, t.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="space-y-3 border-t border-borde p-4 sm:p-5">
            <Nota tono="ayuda">Cambiar una tarifa solo afecta a los viajes nuevos.</Nota>
            <PanelAlta>
              <Formulario accion={crearTarifa} textoBoton="Agregar tarifa">
                <Campo etiqueta="Destino" ancho>
                  <input name="destino" required className={`${claseInput} w-44`} />
                </Campo>
                <Campo etiqueta="Producto">
                  <input name="producto" required className={`${claseInput} w-32`} />
                </Campo>
                <Campo etiqueta="Tarifa (Q)">
                  <EntradaQ>
                    <input
                      name="monto"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      className={`${claseInput} w-32 pl-7 max-sm:w-full`}
                    />
                  </EntradaQ>
                </Campo>
              </Formulario>
            </PanelAlta>
          </div>
        </Tarjeta>

        <div className="space-y-6">
          <Tarjeta
            titulo="Pilotos"
            icono="usuarios"
            flush
            extra={<Pastilla>{listaPilotos.length}</Pastilla>}
          >
            {listaPilotos.length === 0 ? (
              <Vacio icono="usuarios">Sin pilotos registrados.</Vacio>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className={`${claseTabla} whitespace-nowrap`}>
                  <thead className={claseThead}>
                    <tr>
                      <th>Nombre</th>
                      <th className="text-right">Por viaje</th>
                      <th className="text-right">Viático/viaje</th>
                      <th className="text-right">Base</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaPilotos.map((p) => (
                      <tr key={p.id} className={`${claseFila} ${p.activo ? "" : "bg-slate-50 text-slate-600"}`}>
                        <td>
                          <span className="inline-flex items-center gap-2 font-medium text-tinta">
                            <Avatar nombre={p.nombre} />
                            {p.nombre}
                            {!p.activo && (
                              <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                                Inactivo
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="text-right font-medium tabular-nums">{formatoQ(p.pagoPorViaje)}</td>
                        <td className="text-right font-medium tabular-nums">{formatoQ(p.viaticoPorViaje)}</td>
                        <td className="text-right font-medium tabular-nums">{formatoQ(p.base)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="border-t border-borde p-4 sm:p-5">
              <PanelAlta>
                <Formulario accion={crearPiloto} textoBoton="Agregar piloto">
                  <Campo etiqueta="Nombre" ancho>
                    <input name="nombre" required className={`${claseInput} w-40`} />
                  </Campo>
                  <Campo etiqueta="Por viaje">
                    <input name="pagoPorViaje" type="number" step="0.01" min="0" defaultValue="150" className={`${claseInput} w-24`} />
                  </Campo>
                  <Campo etiqueta="Viático/viaje">
                    <input name="viaticoPorViaje" type="number" step="0.01" min="0" defaultValue="75" className={`${claseInput} w-24`} />
                  </Campo>
                  <Campo etiqueta="Base" ancho>
                    <input name="base" type="number" step="0.01" min="0" defaultValue="1500" className={`${claseInput} w-24`} />
                  </Campo>
                </Formulario>
              </PanelAlta>
            </div>
          </Tarjeta>

          <Tarjeta
            titulo="Camiones"
            icono="camion"
            extra={<Pastilla>{listaCamiones.length}</Pastilla>}
          >
            {listaCamiones.length === 0 ? (
              <Vacio icono="camion">Sin camiones registrados.</Vacio>
            ) : (
              <ul className="mb-4 flex flex-wrap gap-2">
                {listaCamiones.map((c) => (
                  <li
                    key={c.id}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-50 py-1 pr-1 pl-2 ring-1 ring-borde"
                  >
                    <Icono nombre="camion" className="size-4 text-suave" />
                    <Placa placa={c.placa} grande />
                  </li>
                ))}
              </ul>
            )}
            <PanelAlta>
              <Formulario accion={crearCamion} textoBoton="Agregar camión">
                <Campo etiqueta="Placa" ancho>
                  <input name="placa" required placeholder="C123ABC" className={`${claseInput} w-36 font-mono uppercase`} />
                </Campo>
              </Formulario>
            </PanelAlta>
          </Tarjeta>
        </div>
      </div>
    </>
  );
}

function Liquidacion({
  piloto,
  cantidadViajes,
  movimientos,
}: {
  piloto: typeof pilotos.$inferSelect;
  cantidadViajes: number;
  movimientos: (typeof movimientosPiloto.$inferSelect)[];
}) {
  const { pagoViajes, viaticos, total, adelantos, prestamos, liquido } =
    calcularLiquidacion(piloto, cantidadViajes, movimientos);
  const descuentos = adelantos + prestamos;
  const pct = (v: number) => (total > 0 ? Math.min(100, Math.max(0, (v / total) * 100)) : 0);
  const fila = "flex items-baseline justify-between gap-3 py-2.5";

  return (
    <article className="overflow-hidden rounded-tarjeta bg-superficie text-sm shadow-tarjeta ring-1 ring-borde transition [@media(hover:hover)]:hover:shadow-elevada">
      <header className="relative isolate flex items-center gap-3 overflow-hidden bg-tinta px-4 py-3 text-white">
        <div aria-hidden className="franjas-diagonales absolute inset-y-0 right-0 -z-10 w-1/2 opacity-25" />
        <Avatar nombre={piloto.nombre} oscuro />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-semibold leading-tight">{piloto.nombre}</h3>
          <p className="truncate text-[11px] text-slate-400">
            <span className="tabular-nums">{formatoQ(piloto.pagoPorViaje)}</span>/viaje · base{" "}
            <span className="tabular-nums">{formatoQ(piloto.base)}</span>
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-acento px-2.5 py-1 text-xs font-semibold tabular-nums shadow-sm">
          {cantidadViajes} {cantidadViajes === 1 ? "viaje" : "viajes"}
        </span>
        <div className="franja-marca absolute inset-x-0 bottom-0 h-[3px]" />
      </header>

      <dl className="divide-y divide-borde px-4">
        <div className={fila}>
          <dt className="text-tenue">
            {cantidadViajes} viajes <span className="font-normal text-tenue">× {formatoQ(piloto.pagoPorViaje)}</span>
          </dt>
          <dd className="font-medium tabular-nums text-tinta">{formatoQ(pagoViajes)}</dd>
        </div>
        <div className={fila}>
          <dt className="text-tenue">Viáticos</dt>
          <dd className="font-medium tabular-nums text-tinta">{formatoQ(viaticos)}</dd>
        </div>
        <div className={fila}>
          <dt className="text-tenue">Base</dt>
          <dd className="font-medium tabular-nums text-tinta">{formatoQ(piloto.base)}</dd>
        </div>
      </dl>

      <div className="mx-4 my-1 flex justify-between rounded-lg bg-slate-50 px-3 py-2 font-semibold text-tinta ring-1 ring-inset ring-borde">
        <span>Total</span>
        <span className="tabular-nums">{formatoQ(total)}</span>
      </div>

      <dl className="divide-y divide-borde px-4">
        {[
          { etiqueta: "Adelanto viático", monto: adelantos },
          { etiqueta: "Descuento de préstamo", monto: prestamos },
        ].map((d) => (
          <div key={d.etiqueta} className={fila}>
            <dt className="flex items-center gap-2 text-tenue">
              <span aria-hidden className="size-1.5 rounded-full bg-acento" />
              {d.etiqueta}
            </dt>
            <dd className="font-medium tabular-nums text-acento-oscuro">−{formatoQ(d.monto)}</dd>
          </div>
        ))}
      </dl>

      {total > 0 && (
        <div className="px-4 pt-1 pb-3">
          <div
            className="flex h-1.5 overflow-hidden rounded-full bg-slate-100"
            role="img"
            aria-label={`Líquido ${Math.round(pct(Math.max(0, liquido)))}%, descuentos ${Math.round(pct(descuentos))}% del total`}
          >
            <div className="h-full bg-marca" style={{ width: `${pct(Math.max(0, liquido))}%` }} />
            <div className="h-full bg-acento" style={{ width: `${pct(descuentos)}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-tenue">
            Descuentos: <span className="tabular-nums">{Math.round(pct(descuentos))}%</span> del total
          </p>
        </div>
      )}

      <div
        className={`flex items-baseline justify-between gap-3 bg-linear-to-r px-4 py-3.5 text-white ${liquido < 0 ? "from-acento-oscuro to-red-900" : "from-marca to-marca-oscuro"}`}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white">
          {liquido < 0 ? "Saldo en contra" : "Total líquido"}
        </span>
        <span className="text-2xl font-semibold tracking-tight tabular-nums">
          {liquido < 0 ? "−" : ""}
          {formatoQ(Math.abs(liquido))}
        </span>
      </div>

      {movimientos.length > 0 && (
        <details className="group border-t border-borde">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 min-h-11 text-xs font-medium text-tenue transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-marca">
            Ver {movimientos.length} {movimientos.length === 1 ? "adelanto/préstamo" : "adelantos/préstamos"}
            <Icono nombre="chevron" className="size-4 transition group-open:rotate-180" />
          </summary>
          <ul className="space-y-1.5 px-4 pb-3 text-xs">
            {movimientos.map((m) => {
              const adelanto = m.tipo === "Adelanto";
              return (
                <li key={m.id} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 font-medium ${adelanto ? "bg-alerta-claro text-amber-800" : "bg-acento-claro text-red-800"}`}
                    >
                      {adelanto ? "Adelanto" : "Préstamo"}
                    </span>
                    <span className="shrink-0 tabular-nums text-tenue">{formatoFecha(m.fecha)}</span>
                    {m.descripcion && <span className="truncate text-tenue">· {m.descripcion}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 font-medium tabular-nums text-tinta">
                    {formatoQ(m.monto)}
                    <BotonBorrar accion={borrarMovimiento.bind(null, m.id)} />
                  </span>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </article>
  );
}
