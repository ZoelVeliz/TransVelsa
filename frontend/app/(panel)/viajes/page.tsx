import { and, asc, count, desc, eq, gte, lte, sum, type SQL } from "drizzle-orm";
import Link from "next/link";
import { io } from "next/cache";
import { Suspense, type ReactNode } from "react";
import {
  asignarViaje,
  borrarViaje,
  cambiarEstatusViaje,
  crearViaje,
} from "@/lib/acciones";
import { ESTATUS_ASIGNADO, ESTATUS_VIAJE } from "@/lib/constantes";
import { camiones, db, pilotos, tarifas, viajes } from "@/lib/db";
import { paginacion, param, paramFecha, paramNumero, type Params } from "@/lib/filtros";
import { anioSemana, formatoFecha, formatoQ, horaFecha, hoyISO, rangoSemana, cantidad } from "@/lib/formato";
import { BORDE_ESTATUS } from "@/components/estatus";
import { Paginacion } from "@/components/paginacion";
import {
  AsignarViaje,
  BotonBorrar,
  Formulario,
  SelectEstatus,
} from "@/components/interactivos";
import {
  Avatar,
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
  PanelAlta,
  Pastilla,
  Placa,
  Resumen,
  Tarjeta,
  TotalMovil,
  Vacio,
} from "@/components/ui";

const CLAVES_FILTRO = ["anio", "semanaDesde", "semanaHasta", "fechaDesde", "fechaHasta", "piloto", "estatus", "todos"];
const VER_TODOS = "/viajes?todos=1";

export default function Page(props: PageProps<"/viajes">) {
  return (
    <div className="space-y-6 animate-entrada">
      <Encabezado
        eyebrow="Operación"
        icono="camion"
        titulo="Planificación de viajes"
        descripcion="Programación de viajes, estatus y fletes por semana"
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

  // Sin ningún filtro en la URL se muestra la semana actual (lunes a domingo).
  // Basta con que venga cualquier clave (aunque vacía, como al enviar el
  // formulario) o ?todos=1 para respetar lo que pidió el usuario.
  const hoy = hoyISO();
  const actual = { ...anioSemana(hoy), ...rangoSemana(hoy) };
  const porDefecto = !CLAVES_FILTRO.some((k) => k in sp);

  // Rangos invertidos (p. ej. semana 40 a 38) se acomodan solos.
  const ordenar = <T extends string | number>(a?: T, b?: T) =>
    a !== undefined && b !== undefined && a > b ? [b, a] : [a, b];
  const [semanaDesde, semanaHasta] = ordenar(paramNumero(sp, "semanaDesde"), paramNumero(sp, "semanaHasta"));
  const [fechaDesde, fechaHasta] = ordenar(paramFecha(sp, "fechaDesde"), paramFecha(sp, "fechaHasta"));
  const filtro = porDefecto
    ? {
        anio: actual.anio,
        semanaDesde: actual.semana,
        semanaHasta: actual.semana,
        fechaDesde: actual.lunes,
        fechaHasta: actual.domingo,
        pilotoId: undefined,
        estatus: undefined,
      }
    : {
        anio: paramNumero(sp, "anio"),
        semanaDesde,
        semanaHasta,
        fechaDesde,
        fechaHasta,
        pilotoId: paramNumero(sp, "piloto"),
        estatus: ESTATUS_VIAJE.find((e) => e === param(sp, "estatus")),
      };

  const condiciones: SQL[] = [];
  if (filtro.anio) condiciones.push(eq(viajes.anio, filtro.anio));
  if (filtro.semanaDesde) condiciones.push(gte(viajes.semana, filtro.semanaDesde));
  if (filtro.semanaHasta) condiciones.push(lte(viajes.semana, filtro.semanaHasta));
  if (filtro.fechaDesde) condiciones.push(gte(viajes.fecha, filtro.fechaDesde));
  if (filtro.fechaHasta) condiciones.push(lte(viajes.fecha, filtro.fechaHasta));
  if (filtro.pilotoId) condiciones.push(eq(viajes.pilotoId, filtro.pilotoId));
  if (filtro.estatus) condiciones.push(eq(viajes.estatus, filtro.estatus));

  const donde = and(...condiciones);
  const [listaPilotos, listaCamiones, listaTarifas, semanas, porEstatus, [porAsignar]] =
    await Promise.all([
      db.select().from(pilotos).where(eq(pilotos.activo, true)).orderBy(asc(pilotos.nombre)),
      db.select().from(camiones).where(eq(camiones.activo, true)).orderBy(asc(camiones.placa)),
      db.select().from(tarifas).orderBy(asc(tarifas.destino), asc(tarifas.producto)),
      db
        .selectDistinct({ anio: viajes.anio, semana: viajes.semana })
        .from(viajes)
        .orderBy(desc(viajes.anio), desc(viajes.semana)),
      // Los resúmenes cubren todos los viajes filtrados, no solo la página visible.
      db
        .select({ estatus: viajes.estatus, n: count(), monto: sum(viajes.tarifaFlete).mapWith(Number) })
        .from(viajes)
        .where(donde)
        .groupBy(viajes.estatus),
      // Pedidos sin camión ni piloto, de cualquier fecha: el aviso no depende de los filtros.
      db.select({ n: count() }).from(viajes).where(eq(viajes.estatus, "Por asignar")),
    ]);

  const contar = (e: string) => porEstatus.find((x) => x.estatus === e)?.n ?? 0;
  const totalFilas = porEstatus.reduce((s, x) => s + x.n, 0);
  const activos = totalFilas - contar("Cancelado");
  const total = porEstatus
    .filter((x) => x.estatus !== "Cancelado")
    .reduce((s, x) => s + (x.monto ?? 0), 0);
  const entregados = contar("Entregado");
  const pctEntregados = activos ? (entregados / activos) * 100 : 0;

  const pag = paginacion(sp);
  const pagina = Math.min(pag.pagina, Math.max(1, Math.ceil(totalFilas / pag.porPagina)));
  const filas = await db
    .select({
      id: viajes.id,
      pedido: viajes.pedido,
      anio: viajes.anio,
      semana: viajes.semana,
      fecha: viajes.fecha,
      placa: camiones.placa,
      piloto: pilotos.nombre,
      planta: viajes.planta,
      destino: viajes.destino,
      producto: viajes.producto,
      estatus: viajes.estatus,
      tarifaFlete: viajes.tarifaFlete,
      enRutaEn: viajes.enRutaEn,
      entregadoEn: viajes.entregadoEn,
    })
    .from(viajes)
    .leftJoin(camiones, eq(viajes.camionId, camiones.id))
    .leftJoin(pilotos, eq(viajes.pilotoId, pilotos.id))
    .where(donde)
    .orderBy(desc(viajes.fecha), desc(viajes.id))
    .limit(pag.porPagina)
    .offset((pagina - 1) * pag.porPagina);

  // La semana y el año actuales siempre aparecen en los filtros, aunque aún no tengan viajes.
  const anios = [...new Set([actual.anio, ...semanas.map((s) => s.anio), ...(filtro.anio ? [filtro.anio] : [])])].sort((a, b) => b - a);
  const listaSemanas = [...new Set([actual.semana, ...semanas.map((s) => s.semana), ...[filtro.semanaDesde, filtro.semanaHasta].filter((s): s is number => !!s)])].sort((a, b) => a - b);
  const hayFiltros = Boolean(
    filtro.anio ||
      filtro.semanaDesde ||
      filtro.semanaHasta ||
      filtro.fechaDesde ||
      filtro.fechaHasta ||
      filtro.pilotoId ||
      filtro.estatus,
  );
  const faltaFlota =
    listaTarifas.length === 0 || listaPilotos.length === 0 || listaCamiones.length === 0;

  const distribucion = ESTATUS_VIAJE.map((e) => ({ estatus: e, n: contar(e) }));
  // Un viaje por asignar se asigna; los demás cambian de estatus.
  const controlEstatus = (f: FilaViaje) =>
    f.estatus === "Por asignar" ? (
      <AsignarViaje camiones={listaCamiones} pilotos={listaPilotos} accion={asignarViaje.bind(null, f.id)} />
    ) : (
      <>
        <SelectEstatus estatus={f.estatus} accion={cambiarEstatusViaje.bind(null, f.id)} />
        <MarcaApp viaje={f} />
      </>
    );

  return (
    <>
      {porAsignar.n > 0 && filtro.estatus !== "Por asignar" && <AvisoPorAsignar n={porAsignar.n} />}
      <Resumen
        datos={[
          { etiqueta: "Viajes", valor: String(activos), icono: "camion", nota: "sin cancelados" },
          {
            etiqueta: "Entregados",
            valor: String(entregados),
            icono: "checkCirculo",
            tono: "exito",
            progreso: pctEntregados,
            nota: `${Math.round(pctEntregados)}% del total`,
          },
          {
            etiqueta: "Programados / en ruta",
            valor: `${contar("Programado")} / ${contar("En ruta")}`,
            icono: "reloj",
          },
          {
            etiqueta: "Total fletes",
            valor: formatoQ(total),
            icono: "billete",
            destacado: true,
            nota: cantidad(activos, "viaje", "viajes"),
          },
        ]}
      />

      <Tarjeta
        id="nuevo-viaje"
        titulo="Nuevo viaje"
        icono="mas"
        descripcion="El flete sale del tarifario"
      >
        {faltaFlota ? (
          <Vacio
            icono="camion"
            titulo="Falta configurar la flota"
            accion={
              <Link href="/choferes" className={claseBotonPrimario}>
                Ir a Tarifario y choferes
              </Link>
            }
          >
            Registra pilotos, camiones y tarifas para poder programar viajes.
          </Vacio>
        ) : (
          <PanelAlta>
            <Formulario accion={crearViaje} textoBoton="Agregar viaje">
              <Campo etiqueta="Fecha" ancho>
                <input name="fecha" type="date" required defaultValue={hoyISO()} className={claseInput} />
              </Campo>
              <Campo etiqueta="Pedido">
                <input
                  name="pedido"
                  required
                  autoComplete="off"
                  placeholder="Núm. pedido"
                  className={`${claseInput} font-mono placeholder:font-sans sm:w-36`}
                />
              </Campo>
              <Campo etiqueta="Placa">
                <select name="camionId" required className={claseInput}>
                  {listaCamiones.map((c) => (
                    <option key={c.id} value={c.id}>{c.placa}</option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Piloto" ancho>
                <select name="pilotoId" required className={claseInput}>
                  {listaPilotos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Planta">
                <input name="planta" required defaultValue="SM" className={`${claseInput} sm:w-20`} />
              </Campo>
              <Campo etiqueta="Estatus">
                <select name="estatus" defaultValue="Programado" className={claseInput}>
                  {ESTATUS_ASIGNADO.map((e) => (
                    <option key={e}>{e}</option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Destino / Producto (tarifa flete)" ancho>
                <select name="tarifaId" required className={`${claseInput} sm:min-w-80`}>
                  {listaTarifas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.destino} / {t.producto} — {formatoQ(t.monto)}
                    </option>
                  ))}
                </select>
              </Campo>
            </Formulario>
          </PanelAlta>
        )}
      </Tarjeta>

      <Tarjeta
        titulo="Viajes"
        icono="lista"
        flush
        descripcion="Más recientes primero"
        extra={<Pastilla tono={totalFilas ? "marca" : "neutro"}>{totalFilas}</Pastilla>}
        acciones={
          <Filtros action="/viajes" activos={hayFiltros} limpiar={VER_TODOS} plegable>
            {pag.porPagina !== 20 && <input type="hidden" name="porPagina" value={pag.porPagina} />}
            <Campo etiqueta="Año">
              <select name="anio" defaultValue={filtro.anio ?? ""} className={claseInput}>
                <option value="">Todos</option>
                {anios.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Estatus">
              <select name="estatus" defaultValue={filtro.estatus ?? ""} className={claseInput}>
                <option value="">Todos</option>
                {ESTATUS_VIAJE.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Semana desde">
              <select name="semanaDesde" defaultValue={filtro.semanaDesde ?? ""} className={claseInput}>
                <option value="">—</option>
                {listaSemanas.map((s) => (
                  <option key={s} value={s}>Semana {s}</option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Semana hasta">
              <select name="semanaHasta" defaultValue={filtro.semanaHasta ?? ""} className={claseInput}>
                <option value="">—</option>
                {listaSemanas.map((s) => (
                  <option key={s} value={s}>Semana {s}</option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Fecha desde" ancho>
              <input name="fechaDesde" type="date" defaultValue={filtro.fechaDesde} className={claseInput} />
            </Campo>
            <Campo etiqueta="Fecha hasta" ancho>
              <input name="fechaHasta" type="date" defaultValue={filtro.fechaHasta} className={claseInput} />
            </Campo>
            <Campo etiqueta="Piloto" ancho>
              <select name="piloto" defaultValue={filtro.pilotoId ?? ""} className={claseInput}>
                <option value="">Todos</option>
                {listaPilotos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </Campo>
          </Filtros>
        }
      >
        {(porDefecto || totalFilas > 0) && (
          <div className="space-y-3.5 border-b border-borde px-3 py-3 sm:px-5 sm:py-4">
            {porDefecto && (
              <BandaSemana semana={actual.semana} anio={actual.anio} lunes={actual.lunes} domingo={actual.domingo} />
            )}
            {totalFilas > 0 && <Distribucion datos={distribucion} total={totalFilas} />}
          </div>
        )}
        {filas.length === 0 ? (
          <Vacio
            icono={porDefecto ? "calendario" : "filtro"}
            titulo={porDefecto ? "Semana sin viajes" : "Sin viajes"}
            accion={
              // En la vista por defecto "Ver todos los viajes" ya está en la banda de la semana.
              porDefecto ? (
                !faltaFlota && (
                  <Link href="#nuevo-viaje" className={claseBotonSecundario}>
                    <Icono nombre="mas" />
                    Agregar un viaje
                  </Link>
                )
              ) : (
                hayFiltros && (
                  <Link href={VER_TODOS} className={claseBotonSecundario}>
                    <Icono nombre="equis" />
                    Limpiar filtros
                  </Link>
                )
              )
            }
          >
            {porDefecto
              ? `Todavía no hay viajes en la semana ${actual.semana}. Agrega uno arriba o revisa semanas anteriores.`
              : hayFiltros
                ? "No hay viajes con estos filtros."
                : "Todavía no hay viajes registrados."}
          </Vacio>
        ) : (
          <>
            {/* Tarjetas hasta lg: con el sidebar, la tabla no cabe antes. */}
            <ul className="space-y-2.5 p-3 sm:p-4 lg:hidden">
              {filas.map((f) => (
                <TarjetaViaje key={f.id} viaje={f} estatus={controlEstatus(f)} />
              ))}
              <li>
                <TotalMovil etiqueta="Total fletes" valor={formatoQ(total)} />
              </li>
            </ul>

            <div className={`hidden lg:block ${claseContenedorTabla}`}>
              <table className={claseTabla}>
                <thead className={claseThead}>
                  <tr>
                    <th>Pedido</th>
                    <th>Fecha</th>
                    <th>Destino / Producto</th>
                    <th>Piloto</th>
                    <th>Placa</th>
                    <th className="max-2xl:hidden">Planta</th>
                    <th>Estatus</th>
                    <th className="text-right">Tarifa flete</th>
                    <th className="relative">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => {
                    const cancelado = f.estatus === "Cancelado";
                    return (
                      <tr key={f.id} className={`${claseFila} ${cancelado ? "bg-slate-50/80 text-slate-600" : ""}`}>
                        <td className="max-w-36 font-mono text-[13px] font-semibold text-tinta">
                          <span className="block truncate" title={f.pedido}>
                            <span className="text-suave">#</span>
                            {f.pedido}
                          </span>
                        </td>
                        <td className="whitespace-nowrap">
                          <span className="block font-medium tabular-nums text-tinta">{formatoFecha(f.fecha)}</span>
                          <span className="block text-xs tabular-nums text-tenue">
                            Sem. {f.semana} · {f.anio}
                          </span>
                        </td>
                        <td className="min-w-44">
                          <span className="block font-medium leading-snug text-tinta">{f.destino}</span>
                          <span className="block text-xs leading-snug text-tenue">{f.producto}</span>
                        </td>
                        <td>
                          {f.piloto ? (
                            <span className="flex min-w-36 items-center gap-2">
                              <Avatar nombre={f.piloto} />
                              <span className="leading-snug">{f.piloto}</span>
                            </span>
                          ) : (
                            <SinAsignar />
                          )}
                        </td>
                        <td>
                          {f.placa ? <Placa placa={f.placa} /> : <SinAsignar />}
                          {/* Entre lg y 2xl la planta va bajo la placa para que la tabla quepa sin scroll. */}
                          <span className="mt-1 block text-xs text-tenue 2xl:hidden">
                            Planta <span className="font-mono font-semibold">{f.planta}</span>
                          </span>
                        </td>
                        <td className="font-mono text-xs font-semibold text-tenue max-2xl:hidden">{f.planta}</td>
                        <td>{controlEstatus(f)}</td>
                        <td className="text-right whitespace-nowrap">
                          {cancelado ? (
                            <span className="tabular-nums text-tenue line-through" title="No suma al total">
                              {formatoQ(f.tarifaFlete)}
                            </span>
                          ) : (
                            <span className="font-semibold tabular-nums text-tinta">{formatoQ(f.tarifaFlete)}</span>
                          )}
                        </td>
                        <td className="w-12 text-right">
                          <BotonBorrar
                            accion={borrarViaje.bind(null, f.id)}
                            pregunta={`¿Borrar el pedido ${f.pedido}?`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className={claseTotal}>
                    {/* La columna Planta se oculta antes de 2xl: el colSpan cambia con ella. */}
                    <td colSpan={6} className="2xl:hidden">
                      <EtiquetaTotal activos={activos} />
                    </td>
                    <td colSpan={7} className="max-2xl:hidden">
                      <EtiquetaTotal activos={activos} />
                    </td>
                    <td className="text-right text-base whitespace-nowrap tabular-nums">{formatoQ(total)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <Paginacion ruta="/viajes" sp={sp} total={totalFilas} pagina={pagina} porPagina={pag.porPagina} />
          </>
        )}
      </Tarjeta>
    </>
  );
}

// Pedidos hechos desde la pantalla de pedidos que esperan camión y piloto.
function AvisoPorAsignar({ n }: { n: number }) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-interno bg-orange-50 p-3 ring-1 ring-orange-300/60 ring-inset sm:px-4"
    >
      <div className="flex min-w-0 flex-1 basis-60 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-orange-600 ring-1 ring-orange-300/60">
          <Icono nombre="alerta" className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-orange-900">
            {cantidad(n, "viaje por asignar", "viajes por asignar")}
          </p>
          <p className="mt-0.5 text-xs text-orange-800">
            Pedidos nuevos sin camión ni piloto. Asígnalos para que le lleguen al chofer.
          </p>
        </div>
      </div>
      <Link href="/viajes?estatus=Por+asignar" className={`${claseBotonSecundario} max-sm:w-full`}>
        <Icono nombre="lista" />
        Ver y asignar
      </Link>
    </div>
  );
}

function SinAsignar() {
  return <span className="text-sm text-suave italic">Sin asignar</span>;
}

function EtiquetaTotal({ activos }: { activos: number }) {
  return (
    <span className="flex items-baseline justify-end gap-2">
      <span className="text-eyebrow font-semibold tracking-[0.1em] text-tinta uppercase">Total filtrado</span>
      <span className="text-xs font-normal text-tenue">{cantidad(activos, "viaje", "viajes")} · sin cancelados</span>
    </span>
  );
}

type Estatus = (typeof ESTATUS_VIAJE)[number];

type FilaViaje = {
  id: number;
  pedido: string;
  anio: number;
  semana: number;
  fecha: string;
  placa: string | null;
  piloto: string | null;
  planta: string;
  destino: string;
  producto: string;
  estatus: Estatus;
  tarifaFlete: number;
  enRutaEn: Date | null;
  entregadoEn: Date | null;
};

// Si el chofer cambió el estatus actual desde su app, cuándo lo hizo (hora de Guatemala).
function MarcaApp({ viaje: f }: { viaje: FilaViaje }) {
  const momento = f.estatus === "En ruta" ? f.enRutaEn : f.estatus === "Entregado" ? f.entregadoEn : null;
  if (!momento) return null;
  return (
    <span className="mt-1 block text-[11px] leading-4 whitespace-nowrap text-tenue tabular-nums">
      desde la app · {horaFecha(momento)}
    </span>
  );
}

const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// "2026-11-02" -> "lun 2 nov" (sin depender de la zona horaria).
function fechaCorta(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  const dia = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return `${DIAS[dia]} ${d} ${MESES[m - 1]}`;
}

const etiquetaMini = "text-[10px] font-semibold tracking-[0.1em] text-tenue uppercase";

// Aviso de la vista por defecto: la semana actual.
function BandaSemana({ semana, anio, lunes, domingo }: { semana: number; anio: number; lunes: string; domingo: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-interno bg-marca-50 p-3 ring-1 ring-marca/15 ring-inset">
      <div className="flex min-w-0 flex-1 basis-60 items-center gap-3">
        <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-control bg-white text-center shadow-control ring-1 ring-marca/20">
          <div className="leading-none">
            <span className={`block ${etiquetaMini}`}>Sem</span>
            <span className="mt-0.5 block text-lg font-bold tabular-nums text-marca-oscuro">{semana}</span>
          </div>
          <span aria-hidden className="franja-marca absolute inset-x-0 bottom-0 h-0.5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-marca-oscuro">
            Mostrando la semana actual
            <span className="sr-only"> (semana {semana})</span>
          </p>
          <p className="mt-0.5 text-xs text-tenue tabular-nums">
            {fechaCorta(lunes)} – {fechaCorta(domingo)} {anio}
            <span className="max-sm:hidden"> · {formatoFecha(lunes)} al {formatoFecha(domingo)}</span>
          </p>
        </div>
      </div>
      <Link href={VER_TODOS} className={`${claseBotonSecundario} max-sm:w-full`}>
        <Icono nombre="lista" />
        Ver todos los viajes
      </Link>
    </div>
  );
}

const SEGMENTO: Record<Estatus, string> = {
  "Por asignar": "bg-orange-500",
  Programado: "bg-marca",
  "En ruta": "bg-amber-500",
  Entregado: "bg-exito",
  Cancelado: "bg-slate-300",
};

// Reparto real por estatus de los viajes filtrados (todas las páginas).
function Distribucion({ datos, total }: { datos: { estatus: Estatus; n: number }[]; total: number }) {
  const resumen = datos.map((d) => `${d.estatus}: ${d.n}`).join(", ");
  return (
    <div>
      <div
        role="img"
        aria-label={`Viajes por estatus. ${resumen}`}
        className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-fondo-2"
      >
        {datos
          .filter((d) => d.n > 0)
          .map((d) => (
            <span
              key={d.estatus}
              className={`h-full origin-left animate-crecer-x ${SEGMENTO[d.estatus]}`}
              style={{ width: `${(d.n / total) * 100}%` }}
            />
          ))}
      </div>
      <ul aria-hidden className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-tenue">
        {datos.map((d) => (
          <li key={d.estatus} className="inline-flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${SEGMENTO[d.estatus]}`} />
            {d.estatus}
            <span className="font-semibold tabular-nums text-tinta">{d.n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className={etiquetaMini}>{etiqueta}</dt>
      <dd className="mt-1 text-sm font-medium text-tinta">{children}</dd>
    </div>
  );
}

// Tarjeta de un viaje en celular y tableta.
function TarjetaViaje({ viaje: f, estatus }: { viaje: FilaViaje; estatus: ReactNode }) {
  const cancelado = f.estatus === "Cancelado";
  return (
    <li className={`${claseTarjetaMovil} border-l-4 ${BORDE_ESTATUS[f.estatus]} ${cancelado ? "bg-slate-50!" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 pt-0.5">
          <p className={etiquetaMini}>Pedido</p>
          <p className="font-mono text-[15px] leading-snug font-semibold wrap-anywhere text-tinta">
            <span className="text-suave">#</span>
            {f.pedido}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end">{estatus}</div>
      </div>

      <div className="mt-2.5 flex items-start gap-2">
        <Icono nombre="pin" className="mt-0.5 size-4 shrink-0 text-acento" />
        <div className="min-w-0">
          <p
            className={`font-display text-[17px] leading-snug font-semibold tracking-tight wrap-break-word ${cancelado ? "text-tenue" : "text-tinta"}`}
          >
            {f.destino}
          </p>
          <p className="text-sm leading-snug wrap-break-word text-tenue">{f.producto}</p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 rounded-lg bg-fondo/80 p-3 ring-1 ring-borde/70 ring-inset">
        <Dato etiqueta="Fecha">
          <span className="tabular-nums">{formatoFecha(f.fecha)}</span>
          <span className="block text-xs font-normal tabular-nums text-tenue">
            Sem. {f.semana} · {f.anio}
          </span>
        </Dato>
        <Dato etiqueta="Piloto">
          {f.piloto ? (
            <span className="flex items-center gap-2">
              <Avatar nombre={f.piloto} />
              <span className="min-w-0 leading-tight wrap-break-word">{f.piloto}</span>
            </span>
          ) : (
            <SinAsignar />
          )}
        </Dato>
        <Dato etiqueta="Placa">{f.placa ? <Placa placa={f.placa} /> : <SinAsignar />}</Dato>
        <Dato etiqueta="Planta">
          <span className="font-mono text-[13px] font-semibold">{f.planta}</span>
        </Dato>
      </dl>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-borde pt-3">
        <div className="min-w-0">
          <p className={etiquetaMini}>
            Tarifa flete{cancelado && <span className="tracking-normal normal-case"> · no suma al total</span>}
          </p>
          <p
            className={`text-xl leading-tight font-semibold tabular-nums ${cancelado ? "text-tenue line-through" : "text-tinta"}`}
          >
            {formatoQ(f.tarifaFlete)}
          </p>
        </div>
        <BotonBorrar accion={borrarViaje.bind(null, f.id)} pregunta={`¿Borrar el pedido ${f.pedido}?`} />
      </div>
    </li>
  );
}
