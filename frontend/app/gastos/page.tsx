import { and, asc, count, desc, eq, gte, lte, sum, type SQL } from "drizzle-orm";
import type { ReactNode } from "react";
import Link from "next/link";
import { io } from "next/cache";
import { Suspense } from "react";
import { borrarGasto, crearGasto } from "@/lib/acciones";
import { CATEGORIAS_GASTO, RESPONSABLES } from "@/lib/constantes";
import { db, gastos } from "@/lib/db";
import { paginacion, param, paramFecha, paramNumero, urlCon, type Params } from "@/lib/filtros";
import { formatoFecha, formatoQ, hoyISO, cantidad } from "@/lib/formato";
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
  PanelAlta,
  Pastilla,
  Resumen,
  Tarjeta,
  TotalMovil,
  Vacio,
} from "@/components/ui";

type Gasto = typeof gastos.$inferSelect;

const responsable = (nombre: string) => RESPONSABLES.find((r) => r.nombre === nombre);
const colorDe = (nombre: string) => responsable(nombre)?.clase ?? "bg-slate-200";
const textoDe = (nombre: string) => responsable(nombre)?.texto ?? "text-tinta";

// Valores únicos de los datos; incluye el filtrado aunque no tenga registros,
// para que el select muestre lo que dice la URL.
const opciones = (valores: number[], actual?: number) =>
  [...new Set(actual && !valores.includes(actual) ? [actual, ...valores] : valores)];

const porcentaje = (parte: number, total: number) =>
  total > 0 ? Math.round((parte / total) * 100) : 0;

export default function Page(props: PageProps<"/gastos">) {
  return (
    <div className="space-y-6 animate-entrada">
      <Encabezado
        eyebrow="Costos"
        icono="bomba"
        titulo="Diésel y gastos"
        descripcion="Combustible, repuestos y quién puso el dinero"
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
  // Si las fechas vienen al revés se intercambian.
  let fechaDesde = paramFecha(sp, "fechaDesde");
  let fechaHasta = paramFecha(sp, "fechaHasta");
  if (fechaDesde && fechaHasta && fechaDesde > fechaHasta)
    [fechaDesde, fechaHasta] = [fechaHasta, fechaDesde];
  const filtro = {
    anio: paramNumero(sp, "anio"),
    semana: paramNumero(sp, "semana"),
    fechaDesde,
    fechaHasta,
    pagadoPor: RESPONSABLES.find((r) => r.nombre === param(sp, "pagadoPor"))?.nombre,
  };

  const condiciones: SQL[] = [];
  if (filtro.anio) condiciones.push(eq(gastos.anio, filtro.anio));
  if (filtro.semana) condiciones.push(eq(gastos.semana, filtro.semana));
  if (filtro.fechaDesde) condiciones.push(gte(gastos.fecha, filtro.fechaDesde));
  if (filtro.fechaHasta) condiciones.push(lte(gastos.fecha, filtro.fechaHasta));
  if (filtro.pagadoPor) condiciones.push(eq(gastos.pagadoPor, filtro.pagadoPor));

  const donde = and(...condiciones);
  const [semanas, agrupado] = await Promise.all([
    db
      .selectDistinct({ anio: gastos.anio, semana: gastos.semana })
      .from(gastos)
      .orderBy(desc(gastos.anio), desc(gastos.semana)),
    // Totales sobre todo lo filtrado, no solo la página visible.
    db
      .select({
        categoria: gastos.categoria,
        pagadoPor: gastos.pagadoPor,
        n: count(),
        monto: sum(gastos.monto).mapWith(Number),
      })
      .from(gastos)
      .where(donde)
      .groupBy(gastos.categoria, gastos.pagadoPor),
  ]);

  const sumar = (f: (x: (typeof agrupado)[number]) => boolean, campo: "n" | "monto") =>
    agrupado.filter(f).reduce((s, x) => s + (x[campo] ?? 0), 0);
  const totalDiesel = sumar((x) => x.categoria === "Diesel", "monto");
  const totalRepuestos = sumar((x) => x.categoria === "Repuestos", "monto");
  const total = totalDiesel + totalRepuestos;
  const nDiesel = sumar((x) => x.categoria === "Diesel", "n");
  const nRepuestos = sumar((x) => x.categoria === "Repuestos", "n");
  const porPersona = Object.fromEntries(
    RESPONSABLES.map((r) => [r.nombre, sumar((x) => x.pagadoPor === r.nombre, "monto")]),
  );

  // Cada tabla pagina por su cuenta: ?paginaDiesel=2&paginaRepuestos=1
  const claves = ["paginaDiesel", "paginaRepuestos"];
  const pagDiesel = paginacion(sp, "paginaDiesel");
  const pagRepuestos = paginacion(sp, "paginaRepuestos");
  const { porPagina } = pagDiesel;
  const acotar = (p: number, n: number) => Math.min(p, Math.max(1, Math.ceil(n / porPagina)));
  const paginaDiesel = acotar(pagDiesel.pagina, nDiesel);
  const paginaRepuestos = acotar(pagRepuestos.pagina, nRepuestos);
  const listar = (categoria: Gasto["categoria"], pagina: number) =>
    db
      .select()
      .from(gastos)
      .where(and(donde, eq(gastos.categoria, categoria)))
      .orderBy(asc(gastos.fecha), asc(gastos.id))
      .limit(porPagina)
      .offset((pagina - 1) * porPagina);
  const [diesel, repuestos] = await Promise.all([
    listar("Diesel", paginaDiesel),
    listar("Repuestos", paginaRepuestos),
  ]);

  const hayFiltros = Boolean(
    filtro.anio || filtro.semana || filtro.fechaDesde || filtro.fechaHasta || filtro.pagadoPor,
  );
  const nTotal = nDiesel + nRepuestos;

  // Resumen legible de lo que se está viendo.
  const contexto: string[] = [];
  if (filtro.semana) contexto.push(`Semana ${filtro.semana}`);
  if (filtro.anio) contexto.push(String(filtro.anio));
  if (filtro.fechaDesde && filtro.fechaHasta)
    contexto.push(`${formatoFecha(filtro.fechaDesde)} – ${formatoFecha(filtro.fechaHasta)}`);
  else if (filtro.fechaDesde) contexto.push(`Desde ${formatoFecha(filtro.fechaDesde)}`);
  else if (filtro.fechaHasta) contexto.push(`Hasta ${formatoFecha(filtro.fechaHasta)}`);
  if (filtro.pagadoPor) contexto.push(`Pagó ${filtro.pagadoPor}`);

  const tablas = [
    {
      titulo: "Diésel",
      filas: diesel,
      total: totalDiesel,
      n: nDiesel,
      pagina: paginaDiesel,
      clave: "paginaDiesel",
    },
    {
      titulo: "Repuestos",
      filas: repuestos,
      total: totalRepuestos,
      n: nRepuestos,
      pagina: paginaRepuestos,
      clave: "paginaRepuestos",
    },
  ];

  return (
    <>
      <Resumen
        datos={[
          {
            etiqueta: "Diésel",
            valor: formatoQ(totalDiesel),
            icono: "bomba",
            tono: "acento",
            nota: `${porcentaje(totalDiesel, total)}% del total`,
            progreso: porcentaje(totalDiesel, total),
          },
          {
            etiqueta: "Repuestos",
            valor: formatoQ(totalRepuestos),
            icono: "llave",
            nota: `${porcentaje(totalRepuestos, total)}% del total`,
            progreso: porcentaje(totalRepuestos, total),
          },
          {
            etiqueta: "Registros",
            valor: String(nTotal),
            icono: "lista",
            nota: `${nDiesel} diésel · ${nRepuestos} repuestos`,
          },
          {
            etiqueta: "Total gastos",
            valor: formatoQ(total),
            icono: "monedas",
            destacado: true,
            nota: hayFiltros ? `${contexto.join(" · ")}` : cantidad(nTotal, "registro", "registros"),
          },
        ]}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Tarjeta
          id="nuevo-gasto"
          titulo="Nuevo gasto"
          icono="mas"
          descripcion="Diésel o repuestos, con quién puso el dinero"
        >
          <PanelAlta>
            <Formulario accion={crearGasto} textoBoton="Agregar gasto">
              <Campo etiqueta="Fecha" ancho>
                <input
                  name="fecha"
                  type="date"
                  required
                  defaultValue={hoyISO()}
                  className={`${claseInput} sm:w-40`}
                />
              </Campo>
              <Campo etiqueta="Tipo">
                <select name="categoria" className={`${claseInput} sm:w-36`}>
                  {CATEGORIAS_GASTO.map((c) => (
                    <option key={c} value={c}>{c === "Diesel" ? "Diésel" : c}</option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Pagado por">
                <select name="pagadoPor" className={`${claseInput} sm:w-36`}>
                  {RESPONSABLES.map((r) => (
                    <option key={r.nombre}>{r.nombre}</option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Descripción" ancho>
                <input
                  name="descripcion"
                  required
                  autoComplete="off"
                  enterKeyHint="done"
                  placeholder="Ej. Carga en Escuintla"
                  className={`${claseInput} sm:w-72`}
                />
              </Campo>
              <Campo etiqueta="Costo">
                <span className="relative block sm:w-32">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-tenue"
                  >
                    Q
                  </span>
                  <input
                    name="monto"
                    type="number"
                    autoComplete="off"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    aria-label="Costo en quetzales"
                    className={`${claseInput} w-full pl-7 text-right tabular-nums`}
                  />
                </span>
              </Campo>
              <Campo etiqueta="Semana">
                <input
                  name="semana"
                  type="number"
                  autoComplete="off"
                  inputMode="numeric"
                  min="1"
                  max="53"
                  placeholder="Auto"
                  aria-describedby="ayuda-semana"
                  title="Si lo dejas vacío se calcula con la fecha"
                  className={`${claseInput} sm:w-24`}
                />
              </Campo>
            </Formulario>
            <p id="ayuda-semana" className="mt-3 flex items-center gap-1.5 text-xs text-tenue">
              <Icono nombre="info" className="size-3.5 shrink-0" />
              Si dejas la semana vacía, se calcula con la fecha.
            </p>
          </PanelAlta>
        </Tarjeta>

        <QuienPago sp={sp} porPersona={porPersona} total={total} activo={filtro.pagadoPor} />
      </div>

      <BarraHerramientas>
        <Filtros action="/gastos" activos={hayFiltros} plegable>
          {porPagina !== 20 && <input type="hidden" name="porPagina" value={porPagina} />}
          <Campo etiqueta="Año">
            <select name="anio" defaultValue={filtro.anio ?? ""} className={`${claseInput} sm:w-28`}>
              <option value="">Todos</option>
              {opciones(semanas.map((s) => s.anio), filtro.anio).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Semana">
            <select name="semana" defaultValue={filtro.semana ?? ""} className={`${claseInput} sm:w-36`}>
              <option value="">Todas</option>
              {opciones(semanas.map((s) => s.semana), filtro.semana).map((s) => (
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
          <Campo etiqueta="Pagado por" ancho>
            <select name="pagadoPor" defaultValue={filtro.pagadoPor ?? ""} className={`${claseInput} sm:w-36`}>
              <option value="">Todos</option>
              {RESPONSABLES.map((r) => (
                <option key={r.nombre}>{r.nombre}</option>
              ))}
            </select>
          </Campo>
        </Filtros>
        <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
          {hayFiltros ? (
            // En celular el botón "Filtros" ya resume lo aplicado; aquí no se repite.
            <span className="contents max-sm:hidden">
              {contexto.map((c) => (
                <Insignia key={c} tono="marca" punto>
                  {c}
                </Insignia>
              ))}
            </span>
          ) : (
            <Insignia tono="neutro" icono="calendario">
              Todo el historial
            </Insignia>
          )}
          <span className="text-xs text-tenue tabular-nums">
            {cantidad(nTotal, "registro", "registros")}
          </span>
        </div>
      </BarraHerramientas>

      {/* Lado a lado solo en pantallas muy anchas: con el menú lateral, a 1440px las tablas no caben completas. */}
      <div className="grid gap-6 2xl:grid-cols-2">
        {tablas.map((t) => (
          <TablaGastos
            key={t.clave}
            titulo={t.titulo}
            filas={t.filas}
            total={t.total}
            n={t.n}
            participacion={porcentaje(t.total, total)}
            hayFiltros={hayFiltros}
            paginacion={
              <Paginacion
                ruta="/gastos"
                sp={sp}
                total={t.n}
                pagina={t.pagina}
                porPagina={porPagina}
                clave={t.clave}
                reiniciar={claves}
              />
            }
          />
        ))}
      </div>
    </>
  );
}

// Reparto por quién puso el dinero. Cada fila filtra por esa persona (o quita el filtro).
function QuienPago({
  sp,
  porPersona,
  total,
  activo,
}: {
  sp: Params;
  porPersona: Record<string, number>;
  total: number;
  activo?: string;
}) {
  const conMonto = RESPONSABLES.filter((r) => (porPersona[r.nombre] ?? 0) > 0);
  const descripcionBarra =
    total > 0
      ? conMonto
          .map((r) => `${r.nombre} ${porcentaje(porPersona[r.nombre] ?? 0, total)}%`)
          .join(", ")
      : "Sin gastos en este periodo";
  return (
    <Tarjeta
      titulo="Quién pagó"
      icono="billetera"
      descripcion={activo ? "Toca de nuevo para ver a todos" : "Toca un nombre para filtrar"}
    >
      <div
        role="img"
        aria-label={`Reparto del gasto: ${descripcionBarra}`}
        className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-fondo-2 ring-1 ring-borde ring-inset"
      >
        {total > 0 &&
          conMonto.map((r) => (
            <span
              key={r.nombre}
              className={`h-full first:rounded-l-full last:rounded-r-full ${r.clase}`}
              style={{ width: `${((porPersona[r.nombre] ?? 0) / total) * 100}%` }}
            />
          ))}
      </div>
      <ul aria-label="Total por quién pagó" className="mt-4 -mx-2 space-y-0.5">
        {RESPONSABLES.map((r) => {
          const monto = porPersona[r.nombre] ?? 0;
          const esActivo = activo === r.nombre;
          return (
            <li key={r.nombre}>
              <Link
                href={urlCon("/gastos", sp, {
                  pagadoPor: esActivo ? undefined : r.nombre,
                  paginaDiesel: undefined,
                  paginaRepuestos: undefined,
                })}
                scroll={false}
                aria-current={esActivo ? "true" : undefined}
                aria-label={`${r.nombre}: ${formatoQ(monto)}${esActivo ? " (filtro aplicado, quitar)" : ", filtrar"}`}
                className="group flex min-h-11 items-center gap-3 rounded-control px-2 py-1.5 text-sm transition-colors hover:bg-fondo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca aria-[current=true]:bg-marca-50 aria-[current=true]:ring-1 aria-[current=true]:ring-marca/20 sm:min-h-10"
              >
                <span aria-hidden className={`size-3.5 shrink-0 rounded ring-1 ring-black/10 ${r.clase}`} />
                <span className="min-w-0 flex-1 truncate font-medium text-tinta">{r.nombre}</span>
                {esActivo && <Icono nombre="equis" className="size-3.5 shrink-0 text-marca-oscuro" />}
                <span className="w-10 text-right text-xs text-tenue tabular-nums">
                  {porcentaje(monto, total)}%
                </span>
                <span
                  className={`w-24 text-right font-semibold whitespace-nowrap tabular-nums ${monto > 0 ? "text-tinta" : "text-suave"}`}
                >
                  {formatoQ(monto)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Tarjeta>
  );
}

const preguntaBorrar = (g: Gasto) =>
  `¿Borrar el gasto "${g.descripcion}" del ${formatoFecha(g.fecha)} por ${formatoQ(g.monto)}?`;

function ChipResponsable({ nombre }: { nombre: string }) {
  return (
    <span
      data-responsable={nombre}
      className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-black/5 ${colorDe(nombre)} ${textoDe(nombre)}`}
    >
      {nombre}
    </span>
  );
}

function TablaGastos({
  titulo,
  filas,
  total,
  n,
  participacion,
  hayFiltros,
  paginacion,
}: {
  titulo: string;
  filas: Gasto[];
  total: number;
  n: number;
  participacion: number;
  hayFiltros: boolean;
  paginacion: ReactNode;
}) {
  const esDiesel = titulo === "Diésel";
  const icono = esDiesel ? "bomba" : "llave";
  return (
    <Tarjeta
      titulo={titulo}
      icono={icono}
      tono={esDiesel ? "acento" : "marca"}
      flush
      descripcion={
        n > 0
          ? `${cantidad(n, "registro", "registros")} · ${participacion}% del total`
          : "Sin registros"
      }
      acciones={
        <p className="text-right">
          <span className="block text-eyebrow font-semibold uppercase tracking-[0.1em] text-tenue">Total</span>
          <span className="text-lg font-semibold text-tinta tabular-nums">{formatoQ(total)}</span>
        </p>
      }
      extra={n > 0 ? <Pastilla tono={esDiesel ? "peligro" : "marca"}>{n}</Pastilla> : undefined}
    >
      {filas.length === 0 ? (
        <Vacio
          icono={icono}
          titulo={esDiesel ? "Sin cargas de diésel" : "Sin repuestos"}
          accion={
            hayFiltros ? (
              <Link href="/gastos" className={claseBotonSecundario}>
                <Icono nombre="equis" />
                Quitar filtros
              </Link>
            ) : (
              <a href="#nuevo-gasto" className={claseBotonSecundario}>
                <Icono nombre="mas" />
                Registrar gasto
              </a>
            )
          }
        >
          {hayFiltros
            ? "No hay gastos de este tipo con los filtros aplicados."
            : "Cuando registres un gasto de este tipo aparecerá aquí."}
        </Vacio>
      ) : (
        <>
          <ul className="space-y-2.5 bg-fondo/60 p-3 sm:p-4 md:hidden">
            {filas.map((g) => (
              <li key={g.id} className={`${claseTarjetaMovil} pl-4`}>
                <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${colorDe(g.pagadoPor)}`} />
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug wrap-break-word text-tinta">
                      {g.descripcion}
                    </p>
                    <p className="mt-1 text-xs text-tenue tabular-nums">
                      {formatoFecha(g.fecha)} · Sem. {g.semana}
                    </p>
                  </div>
                  <span className="pt-px text-base font-semibold whitespace-nowrap text-tinta tabular-nums">
                    {formatoQ(g.monto)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-tenue">
                    Pagó <ChipResponsable nombre={g.pagadoPor} />
                  </span>
                  <span className="-my-1.5 -mr-1.5">
                    <BotonBorrar accion={borrarGasto.bind(null, g.id)} pregunta={preguntaBorrar(g)} />
                  </span>
                </div>
              </li>
            ))}
            <li>
              <TotalMovil etiqueta={`Total ${titulo.toLowerCase()}`} valor={formatoQ(total)} />
            </li>
          </ul>
          <div className={`hidden md:block ${claseContenedorTabla}`}>
            {/* Anchos fijos: Diésel y Repuestos quedan alineadas una bajo la otra. */}
            <table className={`${claseTabla} lg:table-fixed`}>
              <colgroup>
                <col className="lg:w-36" />
                <col />
                <col className="lg:w-36" />
                <col className="lg:w-36" />
                <col className="w-14" />
              </colgroup>
              <thead className={claseThead}>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Pagó</th>
                  <th className="text-right">Costo</th>
                  <th className="w-12">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.map((g) => (
                  <tr key={g.id} className={claseFila}>
                    <td className="whitespace-nowrap">
                      <span className="block font-medium text-tinta tabular-nums">{formatoFecha(g.fecha)}</span>
                      <span className="block text-xs text-tenue tabular-nums">
                        Sem. {g.semana} · {g.anio}
                      </span>
                    </td>
                    <td className="min-w-48 font-medium text-tinta">{g.descripcion}</td>
                    <td>
                      <ChipResponsable nombre={g.pagadoPor} />
                    </td>
                    <td className="whitespace-nowrap text-right font-semibold text-tinta tabular-nums">
                      {formatoQ(g.monto)}
                    </td>
                    <td className="text-right">
                      <BotonBorrar accion={borrarGasto.bind(null, g.id)} pregunta={preguntaBorrar(g)} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={claseTotal}>
                  <td colSpan={3}>
                    <span className="text-eyebrow uppercase tracking-[0.1em] text-tenue">
                      Total {titulo.toLowerCase()}
                    </span>
                    <span className="ml-2 text-xs font-normal text-tenue">
                      {cantidad(n, "registro", "registros")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-right text-base tabular-nums">{formatoQ(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          {paginacion}
        </>
      )}
    </Tarjeta>
  );
}
