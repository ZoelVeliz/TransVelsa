import { and, asc, between, count, desc, eq, max, min, sum } from "drizzle-orm";
import { io } from "next/cache";
import { Suspense, type ReactNode } from "react";
import {
  actualizarMontoTarifa,
  actualizarPagoChoferTarifa,
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
import { anioSemana, cantidad, formatoFecha, formatoQ, hoyISO } from "@/lib/formato";
import {
  BotonBorrar,
  Formulario,
  MontoEditable,
} from "@/components/interactivos";
import {
  Avatar,
  Campo,
  Cargando,
  claseContenedorTabla,
  claseFila,
  claseInput,
  claseTabla,
  claseTarjetaMovil,
  claseThead,
  Encabezado,
  Filtros,
  Icono,
  Insignia,
  Monto,
  Nota,
  PanelAlta,
  Pastilla,
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
    <span className="relative flex sm:inline-flex">
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-suave"
      >
        Q
      </span>
      {children}
    </span>
  );
}

const claseEntradaQ = `${claseInput} w-32 pl-7 tabular-nums max-sm:w-full`;

// Etiqueta pequeña en mayúsculas (cabeceras de grupo, montos en tarjetas).
function Etiqueta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-eyebrow font-semibold uppercase tracking-[0.1em] text-tenue ${className}`}>{children}</p>
  );
}

async function Contenido({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  // La fecha de hoy se lee por visita, no en el prerender (Cache Components).
  await io();

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
        .select({
          pilotoId: viajes.pilotoId,
          cantidadViajes: count(),
          pagoViajes: sum(viajes.pagoChofer).mapWith(Number),
        })
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
  const liquidaciones = pilotosActivos.map((p) => {
    const movs = movimientos.filter((m) => m.pilotoId === p.id);
    const datosViajes = viajesPorPiloto.find((v) => v.pilotoId === p.id) ?? {
      cantidadViajes: 0,
      pagoViajes: 0,
    };
    return { piloto: p, movimientos: movs, calculo: calcularLiquidacion(p, datosViajes, movs) };
  });
  const totalLiquido = liquidaciones.reduce((s, l) => s + l.calculo.liquido, 0);
  const totalViajes = liquidaciones.reduce((s, l) => s + l.calculo.cantidadViajes, 0);
  const totalDescuentos = liquidaciones.reduce(
    (s, l) => s + l.calculo.adelantos + l.calculo.prestamos,
    0,
  );
  const rango = desde === hasta ? `semana ${desde}` : `semanas ${desde} a ${hasta}`;

  return (
    <>
      <Tarjeta
        titulo="Liquidación de pilotos"
        icono="billetera"
        descripcion={`Año ${anio} · ${rango}`}
        acciones={
          <Filtros action="/choferes" boton="Calcular">
            <Campo etiqueta="Año" ancho>
              <input name="anio" type="number" defaultValue={anio} className={`${claseInput} w-20 tabular-nums`} />
            </Campo>
            <Campo etiqueta="Desde semana">
              <input name="desde" type="number" min="1" max="53" defaultValue={desde} className={`${claseInput} w-20 tabular-nums`} />
            </Campo>
            <Campo etiqueta="Hasta semana">
              <input name="hasta" type="number" min="1" max="53" defaultValue={hasta} className={`${claseInput} w-20 tabular-nums`} />
            </Campo>
          </Filtros>
        }
      >
        <div className="space-y-5">
          {liquidaciones.length > 0 && (
            <dl className="grid grid-cols-2 overflow-hidden rounded-interno bg-fondo ring-1 ring-borde ring-inset sm:grid-cols-3">
              <div className="relative isolate col-span-2 overflow-hidden bg-tinta px-4 py-3.5 text-white sm:col-span-1">
                <div aria-hidden className="franjas-diagonales absolute inset-y-0 right-0 -z-10 w-1/2 opacity-20" />
                <dt className="text-eyebrow font-semibold uppercase tracking-[0.1em] text-plata">
                  Líquido a pagar
                </dt>
                <dd className="mt-1 text-kpi font-semibold tracking-tight tabular-nums">
                  {totalLiquido < 0 ? "−" : ""}
                  {formatoQ(Math.abs(totalLiquido))}
                </dd>
                <span aria-hidden className="franja-marca absolute inset-x-0 bottom-0 h-0.5" />
              </div>
              <div className="px-4 py-3.5">
                <dt className="text-eyebrow font-semibold uppercase tracking-[0.1em] text-tenue">Entregados</dt>
                <dd className="mt-1 text-xl font-semibold tracking-tight text-tinta tabular-nums sm:text-kpi">
                  {totalViajes}{" "}
                  <span className="text-sm font-medium tracking-normal text-tenue">
                    {totalViajes === 1 ? "viaje" : "viajes"}
                  </span>
                </dd>
              </div>
              <div className="border-l border-borde px-4 py-3.5">
                <dt className="text-eyebrow font-semibold uppercase tracking-[0.1em] text-tenue">Descuentos</dt>
                <dd className="mt-1 text-xl tracking-tight sm:text-kpi">
                  {totalDescuentos > 0 ? (
                    <Monto valor={totalDescuentos} tipo="salida" />
                  ) : (
                    <span className="font-semibold text-tinta tabular-nums">{formatoQ(0)}</span>
                  )}
                </dd>
              </div>
            </dl>
          )}

          <Nota>
            Solo cuentan los viajes <b>Entregados</b>; cada uno se paga según el tarifario de su
            destino. Adelantos y préstamos se descuentan según su fecha.
          </Nota>

          <div className={liquidaciones.length === 1 ? "grid items-start gap-5 lg:grid-cols-2" : "space-y-5"}>
          {liquidaciones.length === 0 ? (
            <Vacio icono="usuarios" titulo="Sin pilotos activos">
              Agrega pilotos en la sección Pilotos para calcular su liquidación.
            </Vacio>
          ) : liquidaciones.length === 1 ? (
            <Recibo
              piloto={liquidaciones[0].piloto}
              calculo={liquidaciones[0].calculo}
              movimientos={liquidaciones[0].movimientos}
              rango={rango}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {liquidaciones.map((l) => (
                <Recibo
                  key={l.piloto.id}
                  piloto={l.piloto}
                  calculo={l.calculo}
                  movimientos={l.movimientos}
                  rango={rango}
                />
              ))}
            </div>
          )}

          {listaPilotos.length > 0 && (
            <PanelAlta
              titulo="Registrar adelanto o préstamo"
              descripcion="Se descuenta de la liquidación de la semana en que cae su fecha."
            >
              <Formulario accion={crearMovimiento} textoBoton="Registrar">
                <Campo etiqueta="Piloto">
                  <select name="pilotoId" className={`${claseInput} sm:min-w-40`}>
                    {listaPilotos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </Campo>
                <Campo etiqueta="Tipo">
                  <select name="tipo" className={claseInput}>
                    {TIPOS_MOVIMIENTO.map((t) => (
                      <option key={t} value={t}>
                        {t === "Adelanto" ? "Adelanto" : "Préstamo"}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo etiqueta="Fecha" ancho>
                  <input name="fecha" type="date" required defaultValue={hoyISO()} className={claseInput} />
                </Campo>
                <Campo etiqueta="Monto">
                  <EntradaQ>
                    <input
                      name="monto"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      className={claseEntradaQ}
                    />
                  </EntradaQ>
                </Campo>
                <Campo etiqueta="Nota">
                  <input name="descripcion" placeholder="Opcional" className={`${claseInput} w-48`} />
                </Campo>
              </Formulario>
            </PanelAlta>
          )}
          </div>
        </div>
      </Tarjeta>

      <Tarjeta
        titulo="Tarifario"
        icono="pin"
        flush
        extra={listaTarifas.length > 0 ? <Pastilla>{listaTarifas.length}</Pastilla> : undefined}
      >
        {listaTarifas.length === 0 ? (
          <Vacio icono="pin" titulo="Sin tarifas">
            Agrega el primer destino con el formulario de abajo.
          </Vacio>
        ) : (
          <>
            {/* Celular: una tarjeta por destino con sus dos montos. */}
            <ul className="space-y-2.5 p-3 sm:hidden">
              {listaTarifas.map((t) => (
                <li key={t.id} className={`${claseTarjetaMovil} space-y-3`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-marca-50 text-marca ring-1 ring-marca/15">
                        <Icono nombre="pin" className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug text-tinta wrap-break-word">{t.destino}</p>
                        <p className="text-xs leading-5 text-tenue wrap-break-word">{t.producto}</p>
                      </div>
                    </div>
                    <BotonBorrar
                      accion={borrarTarifa.bind(null, t.id)}
                      pregunta={`¿Borrar la tarifa a ${t.destino}?`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 border-t border-dashed border-borde pt-3">
                    <div className="min-w-0 space-y-1.5 [&>span]:w-full [&_input]:w-full">
                      <Etiqueta>Tarifa flete</Etiqueta>
                      <MontoEditable
                        monto={t.monto}
                        etiqueta={`Tarifa flete a ${t.destino}, ${t.producto}`}
                        accion={actualizarMontoTarifa.bind(null, t.id)}
                      />
                    </div>
                    <div className="min-w-0 space-y-1.5 [&>span]:w-full [&_input]:w-full">
                      <Etiqueta>Pago chofer</Etiqueta>
                      <MontoEditable
                        monto={t.pagoChofer}
                        etiqueta={`Pago chofer a ${t.destino}, ${t.producto}`}
                        accion={actualizarPagoChoferTarifa.bind(null, t.id)}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className={`${claseContenedorTabla} max-sm:hidden`}>
              <table className={claseTabla}>
                <thead className={claseThead}>
                  <tr>
                    <th>Destino</th>
                    <th>Producto</th>
                    <th className="text-right">Tarifa flete</th>
                    <th className="text-right">Pago chofer</th>
                    <th className="w-12">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {listaTarifas.map((t) => (
                    <tr key={t.id} className={claseFila}>
                      <td>
                        <span className="inline-flex items-center gap-2.5 font-semibold text-tinta">
                          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-marca-50 text-marca ring-1 ring-marca/15">
                            <Icono nombre="pin" className="size-3.5" />
                          </span>
                          {t.destino}
                        </span>
                      </td>
                      <td className="text-tenue">{t.producto}</td>
                      <td className="text-right">
                        <MontoEditable
                          monto={t.monto}
                          etiqueta={`Tarifa flete a ${t.destino}, ${t.producto}`}
                          accion={actualizarMontoTarifa.bind(null, t.id)}
                        />
                      </td>
                      <td className="text-right">
                        <MontoEditable
                          monto={t.pagoChofer}
                          etiqueta={`Pago chofer a ${t.destino}, ${t.producto}`}
                          accion={actualizarPagoChoferTarifa.bind(null, t.id)}
                        />
                      </td>
                      <td className="w-12 text-right">
                        <BotonBorrar
                          accion={borrarTarifa.bind(null, t.id)}
                          pregunta={`¿Borrar la tarifa a ${t.destino}?`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="space-y-3 border-t border-borde p-4 sm:p-5">
          <PanelAlta titulo="Nueva tarifa">
            <Formulario accion={crearTarifa} textoBoton="Agregar tarifa">
              <Campo etiqueta="Destino">
                <input name="destino" required className={`${claseInput} w-44`} />
              </Campo>
              <Campo etiqueta="Producto">
                <input name="producto" required className={`${claseInput} w-40`} />
              </Campo>
              <Campo etiqueta="Tarifa flete">
                <EntradaQ>
                  <input
                    name="monto"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    className={claseEntradaQ}
                  />
                </EntradaQ>
              </Campo>
              <Campo etiqueta="Pago chofer">
                <EntradaQ>
                  <input
                    name="pagoChofer"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue="150"
                    className={claseEntradaQ}
                  />
                </EntradaQ>
              </Campo>
            </Formulario>
          </PanelAlta>
          <Nota tono="ayuda">Cambiar la tarifa o el pago al chofer solo afecta a los viajes nuevos.</Nota>
        </div>
      </Tarjeta>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Tarjeta
          titulo="Pilotos"
          icono="usuarios"
          flush
          extra={<Pastilla>{listaPilotos.length}</Pastilla>}
        >
          {listaPilotos.length === 0 ? (
            <Vacio icono="usuarios" titulo="Sin pilotos">
              Registra al primer piloto con el formulario de abajo.
            </Vacio>
          ) : (
            <>
              {/* Celular: lista compacta. */}
              <ul className="divide-y divide-borde sm:hidden">
                {listaPilotos.map((p) => (
                  <li key={p.id} className={`flex items-center gap-3 px-4 py-3 ${p.activo ? "" : "bg-fondo"}`}>
                    <Avatar nombre={p.nombre} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug text-tinta wrap-break-word">{p.nombre}</p>
                      {!p.activo && (
                        <span className="mt-1 inline-block">
                          <Insignia>Inactivo</Insignia>
                        </span>
                      )}
                    </div>
                    <dl className="shrink-0 space-y-0.5 text-right text-xs">
                      <div className="flex items-baseline justify-end gap-1.5">
                        <dt className="text-tenue">Viático</dt>
                        <dd className="font-semibold text-tinta tabular-nums">{formatoQ(p.viaticoPorViaje)}</dd>
                      </div>
                      <div className="flex items-baseline justify-end gap-1.5">
                        <dt className="text-tenue">Base</dt>
                        <dd className="font-semibold text-tinta tabular-nums">{formatoQ(p.base)}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
              <div className={`${claseContenedorTabla} max-sm:hidden`}>
                <table className={claseTabla}>
                  <thead className={claseThead}>
                    <tr>
                      <th>Nombre</th>
                      <th className="text-right">Viático/viaje</th>
                      <th className="text-right">Base</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaPilotos.map((p) => (
                      <tr key={p.id} className={`${claseFila} ${p.activo ? "" : "bg-fondo"}`}>
                        <td>
                          <span className="inline-flex flex-wrap items-center gap-2 font-medium text-tinta">
                            <Avatar nombre={p.nombre} />
                            {p.nombre}
                            {!p.activo && <Insignia>Inactivo</Insignia>}
                          </span>
                        </td>
                        <td className="whitespace-nowrap text-right font-medium tabular-nums">{formatoQ(p.viaticoPorViaje)}</td>
                        <td className="whitespace-nowrap text-right font-medium tabular-nums">{formatoQ(p.base)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <div className="border-t border-borde p-4 sm:p-5">
            <PanelAlta titulo="Nuevo piloto">
              <Formulario accion={crearPiloto} textoBoton="Agregar piloto">
                <Campo etiqueta="Nombre" ancho>
                  <input name="nombre" required autoComplete="off" className={`${claseInput} w-44`} />
                </Campo>
                <Campo etiqueta="Viático por viaje">
                  <EntradaQ>
                    <input
                      name="viaticoPorViaje"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue="75"
                      className={`${claseInput} w-28 pl-7 tabular-nums max-sm:w-full`}
                    />
                  </EntradaQ>
                </Campo>
                <Campo etiqueta="Base">
                  <EntradaQ>
                    <input
                      name="base"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue="1500"
                      className={`${claseInput} w-28 pl-7 tabular-nums max-sm:w-full`}
                    />
                  </EntradaQ>
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
          <div className="space-y-4">
            {listaCamiones.length === 0 ? (
              <Vacio icono="camion" titulo="Sin camiones">
                Registra la placa del primer camión de la flota.
              </Vacio>
            ) : (
              <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {listaCamiones.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-col items-center gap-2.5 rounded-interno bg-linear-to-b from-white to-fondo px-3 pt-3.5 pb-3 ring-1 ring-borde"
                  >
                    <PlacaGuatemala placa={c.placa} />
                    <span className="inline-flex items-center gap-1.5 text-xs text-tenue">
                      <Icono nombre="camion" className="size-3.5 text-suave" />
                      Camión
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <PanelAlta titulo="Nuevo camión">
              <Formulario accion={crearCamion} textoBoton="Agregar camión">
                <Campo etiqueta="Placa" ancho>
                  <input
                    name="placa"
                    required
                    placeholder="C123ABC"
                    autoComplete="off"
                    className={`${claseInput} w-36 font-mono tracking-wider uppercase`}
                  />
                </Campo>
              </Formulario>
            </PanelAlta>
          </div>
        </Tarjeta>
      </div>
    </>
  );
}

// Placa estilo Guatemala: banda azul superior con el nombre del país.
function PlacaGuatemala({ placa }: { placa: string }) {
  return (
    <span className="inline-flex w-full max-w-36 flex-col overflow-hidden rounded-md bg-white shadow-control ring-[1.5px] ring-tinta/70">
      <span
        aria-hidden
        className="bg-marca py-0.5 text-center text-[8px] leading-3 font-bold tracking-[0.3em] text-white"
      >
        GUATEMALA
      </span>
      <span className="px-2 py-1.5 text-center font-mono text-lg leading-6 font-bold tracking-[0.14em] whitespace-nowrap text-tinta">
        {placa}
      </span>
    </span>
  );
}

// Línea de recibo: etiqueta, guía punteada y monto.
function LineaRecibo({
  etiqueta,
  detalle,
  children,
}: {
  etiqueta: string;
  detalle?: string;
  children: ReactNode;
}) {
  return (
    <div className="py-1.5">
      <div className="flex items-baseline gap-2">
        <dt className="min-w-0 text-sm text-tinta">{etiqueta}</dt>
        <span aria-hidden className="min-w-4 flex-1 border-b border-dotted border-borde-fuerte" />
        <dd className="shrink-0 text-sm whitespace-nowrap tabular-nums">{children}</dd>
      </div>
      {detalle && <p className="text-xs leading-4 text-tenue tabular-nums">{detalle}</p>}
    </div>
  );
}

function Recibo({
  piloto,
  calculo,
  movimientos,
  rango,
}: {
  piloto: typeof pilotos.$inferSelect;
  rango: string;
  calculo: ReturnType<typeof calcularLiquidacion>;
  movimientos: (typeof movimientosPiloto.$inferSelect)[];
}) {
  const { cantidadViajes, pagoViajes, viaticos, total, adelantos, prestamos, liquido } = calculo;
  const descuentos = adelantos + prestamos;
  const pct = (v: number) => (total > 0 ? Math.min(100, Math.max(0, (v / total) * 100)) : 0);
  const negativo = liquido < 0;
  const descuento = (monto: number) =>
    monto > 0 ? (
      <Monto valor={monto} tipo="salida" className="font-medium" />
    ) : (
      <span className="text-tenue">{formatoQ(0)}</span>
    );

  return (
    <article className="flex flex-col overflow-hidden rounded-interno bg-superficie shadow-tarjeta ring-1 ring-borde transition-shadow duration-200 [@media(hover:hover)]:hover:shadow-elevada">
      <header className="relative isolate flex items-center gap-3 overflow-hidden bg-tinta px-4 py-3.5 text-white">
        <div aria-hidden className="franjas-diagonales absolute inset-y-0 right-0 -z-10 w-1/2 opacity-25" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(90%_120%_at_100%_0%,rgb(29_78_216/0.35),transparent_60%)]"
        />
        <Avatar nombre={piloto.nombre} oscuro />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg leading-tight font-semibold tracking-tight">{piloto.nombre}</h3>
          <p className="mt-0.5 text-xs leading-snug text-plata">
            <span className="tabular-nums">{cantidad(cantidadViajes, "viaje entregado", "viajes entregados")}</span>
            {" · "}
            {rango}
          </p>
        </div>
        <div aria-hidden className="franja-marca absolute inset-x-0 bottom-0 h-[3px]" />
      </header>

      <div className="px-4 pt-3.5 pb-3">
        <Etiqueta>Devengado</Etiqueta>
        <dl className="mt-1">
          <LineaRecibo etiqueta="Pago por viajes" detalle="Según destino">
            <span className="font-medium text-tinta">{formatoQ(pagoViajes)}</span>
          </LineaRecibo>
          <LineaRecibo
            etiqueta="Viáticos"
            detalle={`${cantidadViajes} × ${formatoQ(piloto.viaticoPorViaje)}`}
          >
            <span className="font-medium text-tinta">{formatoQ(viaticos)}</span>
          </LineaRecibo>
          <LineaRecibo etiqueta="Base">
            <span className="font-medium text-tinta">{formatoQ(piloto.base)}</span>
          </LineaRecibo>
        </dl>
        <div className="mt-1.5 flex items-baseline justify-between gap-3 border-t border-borde pt-2.5">
          <span className="text-sm font-semibold text-tinta">Total devengado</span>
          <span className="text-base font-semibold text-tinta tabular-nums">{formatoQ(total)}</span>
        </div>

        <Etiqueta className="mt-4">Descuentos</Etiqueta>
        <dl className="mt-1">
          <LineaRecibo etiqueta="Adelanto de viático">{descuento(adelantos)}</LineaRecibo>
          <LineaRecibo etiqueta="Descuento de préstamo">{descuento(prestamos)}</LineaRecibo>
        </dl>

        {total > 0 && descuentos > 0 && (
          <div className="mt-3">
            <div
              className="flex h-1.5 overflow-hidden rounded-full bg-fondo-2"
              role="img"
              aria-label={`Líquido ${Math.round(pct(Math.max(0, liquido)))}%, descuentos ${Math.round(pct(descuentos))}% del total devengado`}
            >
              <div className="h-full bg-marca" style={{ width: `${pct(Math.max(0, liquido))}%` }} />
              <div className="h-full bg-acento" style={{ width: `${pct(descuentos)}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-tenue">
              Se descuenta el <span className="font-medium tabular-nums text-tinta">{Math.round(pct(descuentos))}%</span> del total devengado
            </p>
          </div>
        )}
      </div>

      {/* Corte de recibo: muescas laterales y línea perforada. */}
      <div aria-hidden className="relative mt-auto h-4">
        <span className="absolute top-1/2 -left-2 size-4 -translate-y-1/2 rounded-full bg-superficie shadow-[inset_-1px_0_0_var(--color-borde)]" />
        <span className="absolute top-1/2 -right-2 size-4 -translate-y-1/2 rounded-full bg-superficie shadow-[inset_1px_0_0_var(--color-borde)]" />
        <span className="absolute inset-x-3 top-1/2 border-t-2 border-dashed border-borde" />
      </div>

      <div
        className={`relative isolate mx-3 mb-3 overflow-hidden rounded-control px-4 py-3 text-white ${negativo ? "bg-linear-to-br from-acento-oscuro to-red-900" : "bg-linear-to-br from-marca to-marca-oscuro"} shadow-boton`}
      >
        <div aria-hidden className="franjas-diagonales absolute inset-y-0 right-0 -z-10 w-1/3 opacity-15" />
        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
          <div>
            <p className="text-eyebrow font-semibold uppercase tracking-[0.1em] text-blue-100">
              {negativo ? "Saldo en contra" : "Total líquido"}
            </p>
            <p className="mt-0.5 text-xs text-white/80">{negativo ? "Debe a la empresa" : "A pagar al piloto"}</p>
          </div>
          <p className="text-kpi font-semibold tracking-tight tabular-nums">
            {negativo ? "−" : ""}
            {formatoQ(Math.abs(liquido))}
          </p>
        </div>
      </div>

      {movimientos.length > 0 && (
        <details className="group border-t border-borde">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold text-tenue transition-colors hover:bg-fondo hover:text-tinta focus-visible:ring-2 focus-visible:ring-marca focus-visible:outline-none focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <Icono nombre="lista" className="size-4" />
              Ver {cantidad(movimientos.length, "adelanto o préstamo", "adelantos y préstamos")}
            </span>
            <Icono nombre="chevron" className="size-4 transition-transform group-open:rotate-180" />
          </summary>
          <ul className="divide-y divide-borde border-t border-borde bg-fondo/60">
            {movimientos.map((m) => {
              const adelanto = m.tipo === "Adelanto";
              return (
                <li key={m.id} className="group flex items-center gap-2 py-1.5 pr-2 pl-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Insignia tono={adelanto ? "alerta" : "peligro"}>{adelanto ? "Adelanto" : "Préstamo"}</Insignia>
                      <span className="text-xs text-tenue tabular-nums">{formatoFecha(m.fecha)}</span>
                    </div>
                    {m.descripcion && <p className="mt-0.5 truncate text-xs text-tenue">{m.descripcion}</p>}
                  </div>
                  <Monto valor={m.monto} tipo="salida" className="text-sm font-medium" />
                  <BotonBorrar
                    accion={borrarMovimiento.bind(null, m.id)}
                    pregunta={`¿Borrar este ${adelanto ? "adelanto" : "préstamo"}?`}
                  />
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </article>
  );
}
