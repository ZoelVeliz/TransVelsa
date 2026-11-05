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
  claseFila,
  claseInput,
  claseTabla,
  claseThead,
  claseTotal,
  Encabezado,
  Filtros,
  Icono,
  Nota,
  PanelAlta,
  Pastilla,
  Tarjeta,
  Vacio,
} from "@/components/ui";

const estiloDe = (cuenta: string) =>
  RESPONSABLES.find((r) => r.nombre === cuenta) ?? { clase: "bg-slate-200", texto: "text-tinta" };

const ESTILO_TIPO: Record<Asiento["tipo"], string> = {
  Ingreso: "bg-exito-claro text-green-800 ring-green-200",
  Egreso: "bg-acento-claro text-red-800 ring-red-200",
  Transferencia: "bg-marca-50 text-marca-oscuro ring-marca/20",
  Gasto: "bg-alerta-claro text-amber-800 ring-amber-200",
};

// Monto con signo: verde si entra, rojo si sale.
function MontoSigno({ monto }: { monto: number }) {
  return (
    <span className={`font-semibold tabular-nums ${monto < 0 ? "text-peligro" : "text-exito"}`}>
      {monto < 0 ? "−" : "+"}
      {formatoQ(Math.abs(monto))}
    </span>
  );
}

function Saldo({ valor, className = "" }: { valor: number; className?: string }) {
  return (
    <span className={`tabular-nums ${valor < 0 ? "text-peligro" : ""} ${className}`}>
      {valor < 0 ? "−" : ""}
      {formatoQ(Math.abs(valor))}
    </span>
  );
}

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
  const hayFiltro = Boolean(filtro.cuenta || filtro.tipo || filtro.fechaDesde || filtro.fechaHasta);

  return (
    <>
      <section aria-label="Saldos" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <div className="relative isolate col-span-2 overflow-hidden rounded-tarjeta bg-tinta p-4 text-white shadow-elevada sm:p-5 lg:col-span-3 2xl:col-span-1">
          <div aria-hidden className="franjas-diagonales absolute inset-y-0 right-0 -z-10 w-2/3 opacity-30" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-200">Total en cuentas</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight xl:text-[28px]">
            <Saldo valor={totalGeneral} className={totalGeneral < 0 ? "text-red-300!" : ""} />
          </p>
          <p className="mt-1 text-xs text-slate-300">Suma de los {CUENTAS.length} saldos</p>
          <div className="franja-marca absolute inset-x-0 bottom-0 h-1" />
        </div>
        {saldos.map((c) => {
          const estilo = estiloDe(c.cuenta);
          const activa = filtro.cuenta === c.cuenta;
          return (
            <Link
              key={c.cuenta}
              href={urlCon("/movimientos", sp, { cuenta: activa ? undefined : c.cuenta, pagina: undefined })}
              scroll={false}
              aria-current={activa ? "true" : undefined}
              title={activa ? "Ver todas las cuentas" : `Ver solo ${c.cuenta}`}
              className="group relative overflow-hidden rounded-tarjeta bg-superficie p-4 shadow-tarjeta ring-1 ring-borde transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca aria-[current=true]:ring-2 aria-[current=true]:ring-marca sm:p-5 [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-elevada"
            >
              <span aria-hidden className={`absolute inset-x-0 top-0 h-1.5 ${estilo.clase}`} />
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-tenue">
                <span aria-hidden className={`size-2.5 shrink-0 rounded-sm ring-1 ring-black/10 ${estilo.clase}`} />
                {c.cuenta}
              </p>
              <p className="mt-2 text-[clamp(1.05rem,5vw,1.5rem)] leading-tight font-semibold tracking-tight wrap-break-word text-tinta sm:text-2xl">
                <Saldo valor={c.saldo} />
              </p>
              <p className="mt-1 text-xs leading-snug text-tenue">
                <span className="text-exito">+{formatoQ(c.entradas)}</span>
                {" · "}
                <span className="text-peligro">−{formatoQ(c.salidas)}</span>
              </p>
            </Link>
          );
        })}
      </section>

      <Tarjeta titulo="Nuevo movimiento" icono="mas">
        <div className="space-y-3">
          <Nota tono="ayuda">
            Para arrancar una cuenta (por ejemplo Caja chica con Q40,000) registra un <b>Ingreso</b> con la
            descripción &quot;Saldo inicial&quot;. Los gastos de Diésel y gastos se restan solos de quien los pagó.
          </Nota>
          <PanelAlta>
            <Formulario accion={crearMovimientoCaja} textoBoton="Registrar">
              <Campo etiqueta="Cuenta">
                <select name="cuenta" defaultValue={filtro.cuenta ?? "Caja chica"} className={`${claseInput} sm:min-w-36`}>
                  {CUENTAS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Tipo">
                <select name="tipo" className={claseInput}>
                  {TIPOS_MOVIMIENTO_CAJA.map((t) => (
                    <option key={t} value={t}>
                      {t === "Ingreso" ? "Ingreso (entra)" : t === "Egreso" ? "Egreso (sale)" : "Transferencia"}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Hacia (transferencias)">
                <select name="cuentaDestino" defaultValue="" className={`${claseInput} sm:min-w-36`}>
                  <option value="">—</option>
                  {CUENTAS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Fecha">
                <input name="fecha" type="date" required defaultValue={hoyISO()} className={claseInput} />
              </Campo>
              <Campo etiqueta="Monto (Q)">
                <span className="relative block sm:w-32">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-tenue"
                  >
                    Q
                  </span>
                  <input name="monto" type="number" step="0.01" min="0.01" required className={`${claseInput} w-full pl-7`} />
                </span>
              </Campo>
              <Campo etiqueta="Descripción" ancho>
                <input name="descripcion" required placeholder="Ej. Saldo inicial" className={`${claseInput} w-56`} />
              </Campo>
            </Formulario>
          </PanelAlta>
        </div>
      </Tarjeta>

      <BarraHerramientas>
        <Filtros action="/movimientos" activos={hayFiltro}>
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
            <select name="tipo" defaultValue={filtro.tipo ?? ""} className={claseInput}>
              <option value="">Todos</option>
              {TIPOS_ASIENTO.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Fecha desde">
            <input name="fechaDesde" type="date" defaultValue={filtro.fechaDesde} className={claseInput} />
          </Campo>
          <Campo etiqueta="Fecha hasta">
            <input name="fechaHasta" type="date" defaultValue={filtro.fechaHasta} className={claseInput} />
          </Campo>
        </Filtros>
      </BarraHerramientas>

      <Tarjeta
        titulo={filtro.cuenta ? `Movimientos de ${filtro.cuenta}` : "Movimientos"}
        icono="lista"
        flush
        extra={<Pastilla>{totales.n}</Pastilla>}
      >
        {filas.length === 0 ? (
          <Vacio icono="billetera" titulo={hayFiltro ? "Sin movimientos con esos filtros" : "Todavía no hay movimientos"}>
            {hayFiltro
              ? "Prueba con otras fechas u otra cuenta."
              : "Registra el saldo inicial de cada cuenta para empezar a llevar la caja."}
          </Vacio>
        ) : (
          <>
            {/* Celular: tarjetas. */}
            <ul className="divide-y divide-borde md:hidden">
              {filas.map((a) => (
                <li key={a.clave} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <PastillaCuenta cuenta={a.cuenta} />
                      <PastillaTipo asiento={a} />
                    </div>
                    <p className="text-sm font-medium wrap-break-word text-tinta">{a.descripcion}</p>
                    <p className="text-xs tabular-nums text-tenue">
                      {formatoFecha(a.fecha)} · saldo <Saldo valor={a.saldo} />
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-sm">
                    <MontoSigno monto={a.monto} />
                    {a.movimientoId !== null && (
                      <BotonBorrar accion={borrarMovimientoCaja.bind(null, a.movimientoId)} />
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="overflow-x-auto scrollbar-thin max-md:hidden">
              <table className={claseTabla}>
                <thead className={claseThead}>
                  <tr>
                    <th>Fecha</th>
                    <th>Cuenta</th>
                    <th>Tipo</th>
                    <th>Descripción</th>
                    <th className="text-right">Entrada</th>
                    <th className="text-right">Salida</th>
                    <th className="text-right">Saldo de la cuenta</th>
                    <th className="w-10">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((a) => (
                    <tr key={a.clave} className={claseFila}>
                      <td className="whitespace-nowrap tabular-nums">{formatoFecha(a.fecha)}</td>
                      <td>
                        <PastillaCuenta cuenta={a.cuenta} />
                      </td>
                      <td>
                        <PastillaTipo asiento={a} />
                      </td>
                      <td className="font-medium text-tinta">{a.descripcion}</td>
                      <td className="whitespace-nowrap text-right font-medium tabular-nums text-exito">
                        {a.monto > 0 ? formatoQ(a.monto) : ""}
                      </td>
                      <td className="whitespace-nowrap text-right font-medium tabular-nums text-peligro">
                        {a.monto < 0 ? formatoQ(-a.monto) : ""}
                      </td>
                      <td className="whitespace-nowrap text-right font-semibold text-tinta">
                        <Saldo valor={a.saldo} />
                      </td>
                      <td className="w-10 text-right">
                        {a.movimientoId !== null ? (
                          <BotonBorrar accion={borrarMovimientoCaja.bind(null, a.movimientoId)} />
                        ) : (
                          <Link
                            href="/gastos"
                            title="Los gastos se editan en Diésel y gastos"
                            className="inline-grid size-8 place-items-center rounded-lg text-suave transition hover:bg-slate-100 hover:text-tinta"
                          >
                            <Icono nombre="bomba" className="size-4" />
                            <span className="sr-only">Ir a Diésel y gastos</span>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={claseTotal}>
                    <td colSpan={4}>Total filtrado</td>
                    <td className="whitespace-nowrap text-right tabular-nums text-exito">{formatoQ(totales.entradas)}</td>
                    <td className="whitespace-nowrap text-right tabular-nums text-peligro">{formatoQ(totales.salidas)}</td>
                    <td className="whitespace-nowrap text-right">
                      <Saldo valor={totales.entradas - totales.salidas} />
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

function PastillaCuenta({ cuenta }: { cuenta: string }) {
  const estilo = estiloDe(cuenta);
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-black/5 ${estilo.clase} ${estilo.texto}`}
    >
      {cuenta}
    </span>
  );
}

function PastillaTipo({ asiento }: { asiento: Asiento }) {
  const texto =
    asiento.tipo === "Transferencia" && asiento.otra
      ? asiento.monto < 0
        ? `→ ${asiento.otra}`
        : `← ${asiento.otra}`
      : asiento.tipo;
  return (
    <span
      title={asiento.tipo === "Transferencia" ? `Transferencia ${asiento.monto < 0 ? "a" : "de"} ${asiento.otra}` : undefined}
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ESTILO_TIPO[asiento.tipo]}`}
    >
      {texto}
    </span>
  );
}
