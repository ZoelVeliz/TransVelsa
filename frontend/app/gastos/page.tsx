import { and, asc, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { Suspense } from "react";
import { borrarGasto, crearGasto } from "@/lib/acciones";
import { CATEGORIAS_GASTO, RESPONSABLES } from "@/lib/constantes";
import { db, gastos } from "@/lib/db";
import { param, paramFecha, paramNumero, type Params } from "@/lib/filtros";
import { formatoFecha, formatoQ, hoyISO } from "@/lib/formato";
import { BotonBorrar, Formulario } from "@/components/interactivos";
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
  PanelAlta,
  Pastilla,
  Resumen,
  Tarjeta,
  Vacio,
} from "@/components/ui";

type Gasto = typeof gastos.$inferSelect;

const colorDe = (nombre: string) =>
  RESPONSABLES.find((r) => r.nombre === nombre)?.clase ?? "bg-slate-200";

const suma = (lista: Gasto[]) => lista.reduce((s, g) => s + g.monto, 0);

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

  const [semanas, filas] = await Promise.all([
    db
      .selectDistinct({ anio: gastos.anio, semana: gastos.semana })
      .from(gastos)
      .orderBy(desc(gastos.anio), desc(gastos.semana)),
    db
      .select()
      .from(gastos)
      .where(and(...condiciones))
      .orderBy(asc(gastos.fecha), asc(gastos.id)),
  ]);

  const diesel = filas.filter((g) => g.categoria === "Diesel");
  const repuestos = filas.filter((g) => g.categoria === "Repuestos");
  const total = suma(filas);
  const totalDiesel = suma(diesel);
  const totalRepuestos = suma(repuestos);

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
          },
          {
            etiqueta: "Repuestos y otros",
            valor: formatoQ(totalRepuestos),
            icono: "llave",
            nota: `${porcentaje(totalRepuestos, total)}% del total`,
          },
          {
            etiqueta: "Registros",
            valor: String(filas.length),
            icono: "lista",
            nota: `${diesel.length} diésel · ${repuestos.length} repuestos`,
          },
          {
            etiqueta: "Total gastos",
            valor: formatoQ(total),
            icono: "monedas",
            destacado: true,
            nota: `${filas.length} registros`,
          },
        ]}
      />

      <Tarjeta titulo="Nuevo gasto" icono="mas">
        <PanelAlta>
          <Formulario accion={crearGasto} textoBoton="Agregar gasto">
            <Campo etiqueta="Tipo">
              <select name="categoria" className={claseInput}>
                {CATEGORIAS_GASTO.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Fecha">
              <input name="fecha" type="date" required defaultValue={hoyISO()} className={claseInput} />
            </Campo>
            <Campo etiqueta="Semana (opcional)">
              <input
                name="semana"
                type="number"
                min="1"
                max="53"
                placeholder="auto"
                title="Si lo dejas vacío se calcula con la fecha"
                className={`${claseInput} w-24`}
              />
            </Campo>
            <Campo etiqueta="Descripción" ancho>
              <input name="descripcion" required className={`${claseInput} w-56`} />
            </Campo>
            <Campo etiqueta="Costo (Q)">
              <span className="relative block sm:w-32">
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-tenue"
                >
                  Q
                </span>
                <input
                  name="monto"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className={`${claseInput} w-full pl-7`}
                />
              </span>
            </Campo>
            <Campo etiqueta="Pagado por">
              <select name="pagadoPor" className={claseInput}>
                {RESPONSABLES.map((r) => (
                  <option key={r.nombre}>{r.nombre}</option>
                ))}
              </select>
            </Campo>
          </Formulario>
        </PanelAlta>
      </Tarjeta>

      <BarraHerramientas>
        <Filtros
          action="/gastos"
          activos={Boolean(
            filtro.anio || filtro.semana || filtro.fechaDesde || filtro.fechaHasta || filtro.pagadoPor,
          )}
        >
          <Campo etiqueta="Año">
            <select name="anio" defaultValue={filtro.anio ?? ""} className={claseInput}>
              <option value="">Todos</option>
              {[...new Set(semanas.map((s) => s.anio))].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Semana">
            <select name="semana" defaultValue={filtro.semana ?? ""} className={claseInput}>
              <option value="">Todas</option>
              {[...new Set(semanas.map((s) => s.semana))].map((s) => (
                <option key={s} value={s}>Semana {s}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Fecha desde">
            <input name="fechaDesde" type="date" defaultValue={filtro.fechaDesde} className={claseInput} />
          </Campo>
          <Campo etiqueta="Fecha hasta">
            <input name="fechaHasta" type="date" defaultValue={filtro.fechaHasta} className={claseInput} />
          </Campo>
          <Campo etiqueta="Pagado por" ancho>
            <select name="pagadoPor" defaultValue={filtro.pagadoPor ?? ""} className={`${claseInput} sm:min-w-32`}>
              <option value="">Todos</option>
              {RESPONSABLES.map((r) => (
                <option key={r.nombre}>{r.nombre}</option>
              ))}
            </select>
          </Campo>
        </Filtros>
        <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
          <Leyenda filas={filas} />
        </div>
      </BarraHerramientas>

      {/* Lado a lado solo en pantallas muy anchas: con el menú lateral, a 1440px las tablas no caben completas. */}
      <div className="grid gap-6 2xl:grid-cols-2">
        <TablaGastos titulo="Diésel" filas={diesel} total={totalDiesel} />
        <TablaGastos titulo="Repuestos" filas={repuestos} total={totalRepuestos} />
      </div>
    </>
  );
}

function Leyenda({ filas }: { filas: Gasto[] }) {
  return (
    <ul aria-label="Total por quién pagó" className="flex flex-wrap gap-2">
      {RESPONSABLES.map((r) => (
        <li
          key={r.nombre}
          className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-borde"
        >
          <span aria-hidden className={`size-3 rounded ${r.clase}`} />
          <span className="font-medium text-tinta">{r.nombre}</span>
          <span className="tabular-nums text-tenue">
            {formatoQ(suma(filas.filter((g) => g.pagadoPor === r.nombre)))}
          </span>
        </li>
      ))}
    </ul>
  );
}

function TablaGastos({
  titulo,
  filas,
  total,
}: {
  titulo: string;
  filas: Gasto[];
  total: number;
}) {
  const esDiesel = titulo === "Diésel";
  const icono = esDiesel ? "bomba" : "llave";
  return (
    <Tarjeta
      titulo={titulo}
      icono={icono}
      tono={esDiesel ? "acento" : "marca"}
      flush
      extra={<Pastilla>{formatoQ(total)}</Pastilla>}
    >
      {filas.length === 0 ? (
        <Vacio icono={icono}>Sin gastos registrados.</Vacio>
      ) : (
        <>
          <ul className="divide-y divide-borde px-4 md:hidden">
            {filas.map((g) => (
              <li key={g.id} className="flex items-start gap-3 py-3">
                <span
                  aria-hidden
                  className={`grid size-9 shrink-0 place-items-center rounded-lg ${esDiesel ? "bg-acento-claro text-acento" : "bg-marca-50 text-marca"}`}
                >
                  <Icono nombre={icono} className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-medium wrap-break-word text-tinta">{g.descripcion}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-tenue">
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden className={`size-2.5 shrink-0 rounded-sm ${colorDe(g.pagadoPor)}`} />
                      {g.pagadoPor}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{formatoFecha(g.fecha)}</span>
                    <span aria-hidden>·</span>
                    <span>Sem. {g.semana}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="font-semibold tabular-nums text-tinta">{formatoQ(g.monto)}</span>
                  <BotonBorrar accion={borrarGasto.bind(null, g.id)} />
                </div>
              </li>
            ))}
            <li className="py-3">
              <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2.5 font-semibold text-tinta ring-1 ring-borde">
                <span>Total</span>
                <span className="tabular-nums">{formatoQ(total)}</span>
              </div>
            </li>
          </ul>
          <div className="hidden overflow-x-auto scrollbar-thin md:block">
            <table className={claseTabla}>
              <thead className={claseThead}>
                <tr>
                  <th>Año</th>
                  <th>Sem.</th>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Pagó</th>
                  <th className="text-right">Costo</th>
                  <th className="w-10">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.map((g) => (
                  <tr key={g.id} className={claseFila}>
                    <td className="tabular-nums text-tenue">{g.anio}</td>
                    <td className="tabular-nums text-tenue">{g.semana}</td>
                    <td className="whitespace-nowrap tabular-nums">{formatoFecha(g.fecha)}</td>
                    <td className="font-medium text-tinta">{g.descripcion}</td>
                    <td>
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium text-tinta ring-1 ring-black/5 ${colorDe(g.pagadoPor)}`}
                      >
                        {g.pagadoPor}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-right font-medium tabular-nums">{formatoQ(g.monto)}</td>
                    <td className="text-right">
                      <BotonBorrar accion={borrarGasto.bind(null, g.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={claseTotal}>
                  <td colSpan={5} className="text-right">Total</td>
                  <td className="whitespace-nowrap text-right text-base tabular-nums">{formatoQ(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </Tarjeta>
  );
}
