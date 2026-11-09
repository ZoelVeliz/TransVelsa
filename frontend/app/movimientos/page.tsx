import Link from "next/link";
import { io } from "next/cache";
import { Suspense } from "react";
import { borrarMovimientoCaja, crearMovimientoCaja } from "@/lib/acciones";
import { RESPONSABLES, TIPOS_MOVIMIENTO_CAJA } from "@/lib/constantes";
import {
  CUENTAS,
  listarAsientos,
  obtenerSaldos,
  TIPOS_ASIENTO,
  totalesAsientos,
  type Asiento,
} from "@/lib/cuentas";
import { paginacion, param, paramFecha, urlCon, type Params } from "@/lib/filtros";
import { formatoFecha, formatoQ, hoyISO } from "@/lib/formato";
import { BotonBorrar, Formulario } from "@/components/interactivos";
import { Paginacion } from "@/components/paginacion";
import {
  BarraHerramientas,
  Campo,
  Cargando,
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
  Monto,
  Nota,
  PanelAlta,
  Pastilla,
  Tarjeta,
  TotalMovil,
  Vacio,
  type NombreIcono,
  type TonoInsignia,
} from "@/components/ui";

const CAJA = "Caja chica";

const estiloDe = (cuenta: string) =>
  RESPONSABLES.find((r) => r.nombre === cuenta) ?? { clase: "bg-slate-200", texto: "text-tinta" };

const TIPO: Record<Asiento["tipo"], { tono: TonoInsignia; icono?: NombreIcono }> = {
  Ingreso: { tono: "exito", icono: "tendencia" },
  Egreso: { tono: "peligro", icono: "tendenciaBaja" },
  Transferencia: { tono: "marca" },
  Gasto: { tono: "alerta", icono: "bomba" },
};

const claseEnlaceGasto =
  "inline-grid size-10 place-items-center rounded-lg text-suave transition-colors hover:bg-fondo-2 hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca lg:size-8";

// "miércoles 04/11/2026": el día de la semana sale de la fecha del asiento (no de hoy).
function fechaLarga(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  const dia = new Date(Date.UTC(a, m - 1, d)).toLocaleDateString("es-GT", { weekday: "long", timeZone: "UTC" });
  return { dia, fecha: formatoFecha(iso) };
}

// Saldo: negro, o rojo con − si la cuenta quedó en negativo.
function Saldo({ valor, className = "" }: { valor: number; className?: string }) {
  return (
    <span className={`whitespace-nowrap tabular-nums ${valor < 0 ? "text-peligro" : ""} ${className}`}>
      {valor < 0 ? "−" : ""}
      {formatoQ(Math.abs(valor))}
    </span>
  );
}

const montoDe = (a: Asiento) => <Monto valor={a.monto} tipo={a.monto < 0 ? "salida" : "entrada"} />;

export default function Page(props: PageProps<"/movimientos">) {
  return (
    <div className="space-y-6 animate-entrada">
      <Encabezado
        eyebrow="Dinero"
        icono="billetera"
        titulo="Caja y cuentas"
        descripcion="Saldo de Caja chica y de cada persona: lo que entra, sale y se gasta"
      />
      <Suspense fallback={<Cargando />}>
        <Contenido searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Contenido({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  // La fecha de hoy se lee por visita, no en el prerender (Cache Components).
  await io();

  let fechaDesde = paramFecha(sp, "fechaDesde");
  let fechaHasta = paramFecha(sp, "fechaHasta");
  if (fechaDesde && fechaHasta && fechaDesde > fechaHasta)
    [fechaDesde, fechaHasta] = [fechaHasta, fechaDesde];
  const filtro = {
    cuenta: CUENTAS.find((c) => c === param(sp, "cuenta")),
    tipo: TIPOS_ASIENTO.find((t) => t === param(sp, "tipo")),
    fechaDesde,
    fechaHasta,
  };

  const [saldos, totales] = await Promise.all([obtenerSaldos(), totalesAsientos(filtro)]);
  const { porPagina, pagina: pedida } = paginacion(sp);
  const pagina = Math.min(pedida, Math.max(1, Math.ceil(totales.n / porPagina)));
  const filas = await listarAsientos(filtro, porPagina, (pagina - 1) * porPagina);
  const totalGeneral = saldos.reduce((s, c) => s + c.saldo, 0);
  const entradasGeneral = saldos.reduce((s, c) => s + c.entradas, 0);
  const salidasGeneral = saldos.reduce((s, c) => s + c.salidas, 0);
  const hayFiltro = Boolean(filtro.cuenta || filtro.tipo || filtro.fechaDesde || filtro.fechaHasta);
  const neto = totales.entradas - totales.salidas;
  // Celular: los asientos se agrupan por día, en el mismo orden en que llegan.
  const dias: { fecha: string; asientos: Asiento[] }[] = [];
  for (const a of filas) {
    const ultimo = dias.at(-1);
    if (ultimo?.fecha === a.fecha) ultimo.asientos.push(a);
    else dias.push({ fecha: a.fecha, asientos: [a] });
  }

  return (
    <>
      {/* Total y Caja chica ocupan dos columnas: con 4 personas más no queda ninguna tarjeta sola. */}
      <section aria-label="Saldos por cuenta" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="relative isolate col-span-2 flex flex-col overflow-hidden rounded-tarjeta bg-tinta p-4 text-white shadow-elevada ring-1 ring-white/5 sm:p-5">
          <div aria-hidden className="franjas-diagonales absolute inset-y-0 right-0 -z-10 w-2/3 opacity-30" />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_100%_0%,rgb(29_78_216/0.5),transparent_60%)]"
          />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-eyebrow font-semibold uppercase tracking-[0.1em] text-blue-200">Total en cuentas</p>
              <p className="mt-0.5 text-xs text-slate-300">Suma de las {CUENTAS.length} cuentas</p>
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-white/10 ring-1 ring-white/15">
              <Icono nombre="billetera" className="size-4.5" />
            </span>
          </div>
          <p className="mt-3 mb-4 text-[clamp(1.75rem,8vw,2.25rem)] leading-tight font-semibold tracking-tight tabular-nums">
            <Saldo valor={totalGeneral} className={totalGeneral < 0 ? "text-red-300!" : ""} />
          </p>
          <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-xs">
            <div className="min-w-0">
              <dt className="text-slate-300">Entró</dt>
              <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-green-300">
                +{formatoQ(entradasGeneral)}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-slate-300">Salió</dt>
              <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-red-300">
                −{formatoQ(salidasGeneral)}
              </dd>
            </div>
          </dl>
          <div className="franja-marca absolute inset-x-0 bottom-0 h-1" />
        </div>
        {[...saldos]
          .sort((a, b) => Number(b.cuenta === CAJA) - Number(a.cuenta === CAJA))
          .map((c) => (
            <TarjetaCuenta
              key={c.cuenta}
              cuenta={c.cuenta}
              saldo={c.saldo}
              entradas={c.entradas}
              salidas={c.salidas}
              activa={filtro.cuenta === c.cuenta}
              href={urlCon("/movimientos", sp, {
                cuenta: filtro.cuenta === c.cuenta ? undefined : c.cuenta,
                pagina: undefined,
              })}
            />
          ))}
      </section>

      <Tarjeta id="nuevo-movimiento" titulo="Nuevo movimiento" icono="mas" descripcion="Ingreso, egreso o transferencia entre cuentas">
        <div className="space-y-3">
          {/* Tipo primero porque decide los campos. "Hacia" solo aparece con Transferencia (CSS :has,
              sin JS; el servidor lo ignora en los demás tipos). En celular, Cuenta ocupa toda la fila y
              con Transferencia comparte la fila con Hacia. */}
          <PanelAlta>
            <div className="[&_.campo-hacia]:hidden [&:has(option[value=Transferencia]:checked)_.campo-hacia]:contents max-sm:[&_.campo-cuenta>label]:col-span-2 max-sm:[&:has(option[value=Transferencia]:checked)_.campo-cuenta>label]:col-span-1">
              <Formulario accion={crearMovimientoCaja} textoBoton="Registrar movimiento">
                <Campo etiqueta="Tipo" ancho>
                  <select name="tipo" className={`${claseInput} sm:min-w-36`}>
                    {TIPOS_MOVIMIENTO_CAJA.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Campo>
                <div className="campo-cuenta contents">
                  <Campo etiqueta="Cuenta">
                    <select name="cuenta" defaultValue={filtro.cuenta ?? CAJA} className={`${claseInput} sm:min-w-36`}>
                      {CUENTAS.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </Campo>
                </div>
                <div className="campo-hacia">
                  <Campo etiqueta="Hacia (recibe)">
                    <select name="cuentaDestino" defaultValue="" className={`${claseInput} sm:min-w-36`}>
                      <option value="">Elige…</option>
                      {CUENTAS.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </Campo>
                </div>
                <Campo etiqueta="Monto" ancho>
                  <span className="relative block sm:w-36">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-tenue"
                    >
                      Q
                    </span>
                    <input
                      name="monto"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0.01"
                      required
                      autoComplete="off"
                      placeholder="0.00"
                      aria-label="Monto en quetzales"
                      className={`${claseInput} w-full pl-7 tabular-nums`}
                    />
                  </span>
                </Campo>
                <Campo etiqueta="Fecha" ancho>
                  <input name="fecha" type="date" required defaultValue={hoyISO()} className={claseInput} />
                </Campo>
                <Campo etiqueta="Descripción" ancho>
                  <input
                    name="descripcion"
                    required
                    autoComplete="off"
                    placeholder="Ej. Saldo inicial"
                    className={`${claseInput} sm:w-64 xl:w-80`}
                  />
                </Campo>
              </Formulario>
            </div>
          </PanelAlta>
          <Nota tono="ayuda">
            Para arrancar una cuenta (por ejemplo Caja chica con Q40,000) registra un <b>Ingreso</b> con la
            descripción &quot;Saldo inicial&quot;. Los gastos de Diésel y gastos se restan solos de quien los pagó.
          </Nota>
        </div>
      </Tarjeta>

      <BarraHerramientas>
        <Filtros action="/movimientos" activos={hayFiltro} plegable>
          {porPagina !== 20 && <input type="hidden" name="porPagina" value={porPagina} />}
          <Campo etiqueta="Cuenta">
            <select name="cuenta" defaultValue={filtro.cuenta ?? ""} className={`${claseInput} sm:min-w-36`}>
              <option value="">Todas</option>
              {CUENTAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Tipo">
            <select name="tipo" defaultValue={filtro.tipo ?? ""} className={`${claseInput} sm:min-w-36`}>
              <option value="">Todos</option>
              {TIPOS_ASIENTO.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Desde" ancho>
            <input name="fechaDesde" type="date" defaultValue={filtro.fechaDesde} className={claseInput} />
          </Campo>
          <Campo etiqueta="Hasta" ancho>
            <input name="fechaHasta" type="date" defaultValue={filtro.fechaHasta} className={claseInput} />
          </Campo>
        </Filtros>
      </BarraHerramientas>

      <Tarjeta
        titulo={filtro.cuenta ? `Movimientos de ${filtro.cuenta}` : "Movimientos"}
        descripcion="Saldo corrido por cuenta"
        icono="lista"
        flush
        extra={<Pastilla tono={totales.n > 0 ? "marca" : "neutro"}>{totales.n}</Pastilla>}
      >
        {filas.length === 0 ? (
          <Vacio
            icono="billetera"
            titulo={hayFiltro ? "Sin movimientos con esos filtros" : "Todavía no hay movimientos"}
            accion={
              hayFiltro ? (
                <Link href="/movimientos" className={claseBotonSecundario}>
                  <Icono nombre="equis" />
                  Quitar filtros
                </Link>
              ) : (
                <a href="#nuevo-movimiento" className={claseBotonSecundario}>
                  <Icono nombre="mas" />
                  Registrar movimiento
                </a>
              )
            }
          >
            {hayFiltro
              ? "Prueba con otras fechas u otra cuenta."
              : "Registra el saldo inicial de cada cuenta para empezar a llevar la caja."}
          </Vacio>
        ) : (
          <>
            {/* Celular: tarjetas agrupadas por día. */}
            <div className="space-y-4 bg-fondo/60 p-3 sm:p-4 md:hidden">
              {dias.map((d) => {
                const { dia, fecha } = fechaLarga(d.fecha);
                return (
                  <section key={d.fecha} aria-label={`${dia} ${fecha}`}>
                    <h3 className="mb-2 flex items-baseline gap-2 px-1 text-eyebrow font-semibold uppercase tracking-[0.1em] text-tenue">
                      <span>{dia}</span>
                      <span className="tabular-nums text-suave">{fecha}</span>
                    </h3>
                    <ul className="space-y-2.5">
                      {d.asientos.map((a) => (
                        <li
                          key={a.clave}
                          className={`${claseTarjetaMovil} border-l-4 ${a.monto < 0 ? "border-l-peligro" : "border-l-exito"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                              <PastillaCuenta cuenta={a.cuenta} />
                              <PastillaTipo asiento={a} />
                            </div>
                            <span className="shrink-0 text-base">{montoDe(a)}</span>
                          </div>
                          <p className="mt-2 text-sm font-medium wrap-break-word text-tinta">{a.descripcion}</p>
                          <div className="mt-2 flex items-center justify-between gap-3 border-t border-borde/70 pt-2">
                            <p className="text-xs text-tenue">
                              Saldo de {a.cuenta}:{" "}
                              <Saldo valor={a.saldo} className="font-semibold text-tinta" />
                            </p>
                            <div className="-my-1.5 -mr-1.5 shrink-0">
                              <AccionAsiento asiento={a} />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
              <div className="space-y-2.5 pt-1">
                <dl className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-interno bg-superficie px-3.5 py-3 shadow-tarjeta ring-1 ring-borde">
                    <dt className="text-eyebrow font-semibold uppercase tracking-[0.1em] text-tenue">Entradas</dt>
                    <dd className="mt-1 text-sm">
                      <Monto valor={totales.entradas} tipo="entrada" />
                    </dd>
                  </div>
                  <div className="rounded-interno bg-superficie px-3.5 py-3 shadow-tarjeta ring-1 ring-borde">
                    <dt className="text-eyebrow font-semibold uppercase tracking-[0.1em] text-tenue">Salidas</dt>
                    <dd className="mt-1 text-sm">
                      <Monto valor={totales.salidas} tipo="salida" />
                    </dd>
                  </div>
                </dl>
                <TotalMovil
                  etiqueta={hayFiltro ? "Neto filtrado" : "Neto"}
                  valor={
                    <span className={neto < 0 ? "text-red-300" : "text-green-300"}>
                      {neto < 0 ? "−" : "+"}
                      {formatoQ(Math.abs(neto))}
                    </span>
                  }
                />
              </div>
            </div>

            <div className={`${claseContenedorTabla} max-md:hidden`}>
              <table className={claseTabla}>
                <thead className={claseThead}>
                  <tr>
                    <th>Fecha</th>
                    <th>Cuenta</th>
                    <th>Tipo</th>
                    <th className="w-full">Descripción</th>
                    <th className="text-right">Entrada</th>
                    <th className="text-right">Salida</th>
                    <th className="text-right">Saldo</th>
                    <th className="w-10">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((a) => (
                    <tr key={a.clave} className={claseFila}>
                      <td className="whitespace-nowrap tabular-nums text-tenue">{formatoFecha(a.fecha)}</td>
                      <td>
                        <PastillaCuenta cuenta={a.cuenta} />
                      </td>
                      <td>
                        <PastillaTipo asiento={a} />
                      </td>
                      <td className="min-w-48 font-medium text-tinta">{a.descripcion}</td>
                      <td className="whitespace-nowrap text-right">
                        {a.monto > 0 ? <Monto valor={a.monto} tipo="entrada" className="font-medium" /> : <Raya />}
                      </td>
                      <td className="whitespace-nowrap text-right">
                        {a.monto < 0 ? <Monto valor={a.monto} tipo="salida" className="font-medium" /> : <Raya />}
                      </td>
                      <td className="bg-fondo/50 text-right font-semibold text-tinta">
                        <Saldo valor={a.saldo} />
                      </td>
                      <td className="w-10 text-right">
                        <AccionAsiento asiento={a} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={claseTotal}>
                    <td colSpan={4}>
                      <span className="text-eyebrow uppercase tracking-[0.1em] text-tenue">
                        {hayFiltro ? "Total filtrado" : "Total"}
                      </span>
                    </td>
                    <td className="text-right">
                      <Monto valor={totales.entradas} tipo="entrada" className="text-base" />
                    </td>
                    <td className="text-right">
                      <Monto valor={totales.salidas} tipo="salida" className="text-base" />
                    </td>
                    <td className="text-right">
                      <span className="mr-1.5 text-[11px] font-medium text-tenue">Neto</span>
                      <Monto valor={neto} tipo={neto < 0 ? "salida" : "entrada"} className="text-base" />
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
        <Paginacion ruta="/movimientos" sp={sp} total={totales.n} pagina={pagina} porPagina={porPagina} />
      </Tarjeta>
    </>
  );
}

function Raya() {
  return (
    <span aria-hidden className="text-borde-fuerte">
      —
    </span>
  );
}

function TarjetaCuenta({
  cuenta,
  saldo,
  entradas,
  salidas,
  activa,
  href,
}: {
  cuenta: string;
  saldo: number;
  entradas: number;
  salidas: number;
  activa: boolean;
  href: string;
}) {
  const estilo = estiloDe(cuenta);
  const caja = cuenta === CAJA;
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={activa ? "true" : undefined}
      aria-label={`${cuenta}: saldo ${saldo < 0 ? "−" : ""}${formatoQ(Math.abs(saldo))}. ${activa ? "Ver todas las cuentas" : `Ver solo ${cuenta}`}`}
      className={`${caja ? "col-span-2" : ""} group relative flex flex-col overflow-hidden rounded-tarjeta bg-superficie p-4 shadow-tarjeta ring-1 ring-borde transition-[box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca aria-[current=true]:bg-marca-50/50 aria-[current=true]:ring-2 aria-[current=true]:ring-marca sm:p-5 [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-elevada`}
    >
      <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${estilo.clase}`} />
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 text-eyebrow font-semibold uppercase tracking-[0.1em] text-tenue">
          <span aria-hidden className={`size-2.5 shrink-0 rounded-sm ring-1 ring-black/10 ${estilo.clase}`} />
          <span className="truncate">{cuenta}</span>
        </p>
        {activa ? (
          <span className="shrink-0">
            <Insignia tono="marca" icono="filtro">
              Filtrando
            </Insignia>
          </span>
        ) : (
          <Icono
            nombre="chevronDer"
            className="size-4 shrink-0 text-suave transition-transform group-hover:translate-x-0.5 group-hover:text-marca"
          />
        )}
      </div>
      <p
        className={`mt-2.5 mb-3 leading-tight font-semibold tracking-tight text-tinta ${caja ? "text-[clamp(1.5rem,7vw,1.875rem)] sm:text-kpi-lg" : "text-[clamp(1.05rem,5vw,1.5rem)] sm:text-kpi"}`}
      >
        <Saldo valor={saldo} className="whitespace-normal! wrap-break-word" />
      </p>
      {caja ? (
        <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-borde/80 pt-2.5 text-xs">
          <div className="min-w-0">
            <dt className="text-tenue">Entró</dt>
            <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-exito">+{formatoQ(entradas)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-tenue">Salió</dt>
            <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-peligro">−{formatoQ(salidas)}</dd>
          </div>
        </dl>
      ) : (
        <dl className="mt-auto space-y-0.5 border-t border-borde/80 pt-2.5 text-xs">
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <dt className="text-tenue">Entró</dt>
            <dd className="truncate font-medium tabular-nums text-exito">+{formatoQ(entradas)}</dd>
          </div>
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <dt className="text-tenue">Salió</dt>
            <dd className="truncate font-medium tabular-nums text-peligro">−{formatoQ(salidas)}</dd>
          </div>
        </dl>
      )}
    </Link>
  );
}

function AccionAsiento({ asiento }: { asiento: Asiento }) {
  if (asiento.movimientoId !== null)
    return <BotonBorrar accion={borrarMovimientoCaja.bind(null, asiento.movimientoId)} />;
  return (
    <Link href="/gastos" title="Los gastos se editan en Diésel y gastos" className={claseEnlaceGasto}>
      <Icono nombre="bomba" className="size-4" />
      <span className="sr-only">Ir a Diésel y gastos</span>
    </Link>
  );
}

function PastillaCuenta({ cuenta }: { cuenta: string }) {
  const estilo = estiloDe(cuenta);
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-black/5 ${estilo.clase} ${estilo.texto}`}
    >
      {cuenta}
    </span>
  );
}

function PastillaTipo({ asiento }: { asiento: Asiento }) {
  const { tono, icono } = TIPO[asiento.tipo];
  const transferencia = asiento.tipo === "Transferencia" && asiento.otra;
  const texto = transferencia ? `${asiento.monto < 0 ? "→" : "←"} ${asiento.otra}` : asiento.tipo;
  return (
    <span title={transferencia ? `Transferencia ${asiento.monto < 0 ? "a" : "de"} ${asiento.otra}` : undefined}>
      <Insignia tono={tono} icono={icono}>
        {transferencia && <span className="sr-only">Transferencia {asiento.monto < 0 ? "a" : "de"} {asiento.otra}</span>}
        <span aria-hidden={transferencia ? true : undefined}>{texto}</span>
      </Insignia>
    </span>
  );
}
