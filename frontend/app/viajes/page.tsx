import { and, asc, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import {
  borrarViaje,
  cambiarEstatusViaje,
  crearViaje,
} from "@/lib/acciones";
import { ESTATUS_VIAJE } from "@/lib/constantes";
import { camiones, db, pilotos, tarifas, viajes } from "@/lib/db";
import { param, paramFecha, paramNumero, type Params } from "@/lib/filtros";
import { formatoFecha, formatoQ, hoyISO } from "@/lib/formato";
import { BORDE_ESTATUS } from "@/components/estatus";
import {
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
  Placa,
  Resumen,
  Tarjeta,
  Vacio,
} from "@/components/ui";

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
  // Rangos invertidos (p. ej. semana 40 a 38) se acomodan solos.
  const ordenar = <T extends string | number>(a?: T, b?: T) =>
    a !== undefined && b !== undefined && a > b ? [b, a] : [a, b];
  const [semanaDesde, semanaHasta] = ordenar(paramNumero(sp, "semanaDesde"), paramNumero(sp, "semanaHasta"));
  const [fechaDesde, fechaHasta] = ordenar(paramFecha(sp, "fechaDesde"), paramFecha(sp, "fechaHasta"));
  const filtro = {
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

  const [listaPilotos, listaCamiones, listaTarifas, semanas, filas] =
    await Promise.all([
      db.select().from(pilotos).where(eq(pilotos.activo, true)).orderBy(asc(pilotos.nombre)),
      db.select().from(camiones).where(eq(camiones.activo, true)).orderBy(asc(camiones.placa)),
      db.select().from(tarifas).orderBy(asc(tarifas.destino), asc(tarifas.producto)),
      db
        .selectDistinct({ anio: viajes.anio, semana: viajes.semana })
        .from(viajes)
        .orderBy(desc(viajes.anio), desc(viajes.semana)),
      db
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
        })
        .from(viajes)
        .innerJoin(camiones, eq(viajes.camionId, camiones.id))
        .innerJoin(pilotos, eq(viajes.pilotoId, pilotos.id))
        .where(and(...condiciones))
        .orderBy(desc(viajes.fecha), desc(viajes.id)),
    ]);

  const activos = filas.filter((f) => f.estatus !== "Cancelado");
  const total = activos.reduce((s, f) => s + f.tarifaFlete, 0);
  const contar = (e: string) => filas.filter((f) => f.estatus === e).length;
  const entregados = contar("Entregado");
  const pctEntregados = activos.length ? (entregados / activos.length) * 100 : 0;
  const anios = [...new Set(semanas.map((s) => s.anio))];
  const listaSemanas = [...new Set(semanas.map((s) => s.semana))].sort((a, b) => a - b);
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

  return (
    <>
      <Resumen
        datos={[
          { etiqueta: "Viajes", valor: String(activos.length), icono: "camion", nota: "sin cancelados" },
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
            nota: `${activos.length} viajes`,
          },
        ]}
      />

      <Tarjeta titulo="Nuevo viaje" icono="mas">
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
              <Campo etiqueta="Pedido">
                <input name="pedido" required className={`${claseInput} w-32`} />
              </Campo>
              <Campo etiqueta="Fecha">
                <input name="fecha" type="date" required defaultValue={hoyISO()} className={claseInput} />
              </Campo>
              <Campo etiqueta="Placa">
                <select name="camionId" required className={claseInput}>
                  {listaCamiones.map((c) => (
                    <option key={c.id} value={c.id}>{c.placa}</option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Piloto">
                <select name="pilotoId" required className={claseInput}>
                  {listaPilotos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Planta">
                <input name="planta" required defaultValue="SM" className={`${claseInput} w-16`} />
              </Campo>
              <Campo etiqueta="Destino / Producto" ancho>
                <select name="tarifaId" required className={claseInput}>
                  {listaTarifas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.destino} / {t.producto} — {formatoQ(t.monto)}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Estatus">
                <select name="estatus" defaultValue="Programado" className={claseInput}>
                  {ESTATUS_VIAJE.map((e) => (
                    <option key={e}>{e}</option>
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
        extra={<Pastilla>{filas.length}</Pastilla>}
        acciones={
          <Filtros action="/viajes" activos={hayFiltros}>
            <Campo etiqueta="Año">
              <select name="anio" defaultValue={filtro.anio ?? ""} className={claseInput}>
                <option value="">Todos</option>
                {anios.map((a) => (
                  <option key={a} value={a}>{a}</option>
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
            <Campo etiqueta="Fecha desde">
              <input name="fechaDesde" type="date" defaultValue={filtro.fechaDesde} className={claseInput} />
            </Campo>
            <Campo etiqueta="Fecha hasta">
              <input name="fechaHasta" type="date" defaultValue={filtro.fechaHasta} className={claseInput} />
            </Campo>
            <Campo etiqueta="Piloto">
              <select name="piloto" defaultValue={filtro.pilotoId ?? ""} className={claseInput}>
                <option value="">Todos</option>
                {listaPilotos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
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
          </Filtros>
        }
      >
        {filas.length === 0 ? (
          <Vacio
            icono="filtro"
            titulo="Sin viajes"
            accion={
              hayFiltros && (
                <Link href="/viajes" className={claseBotonSecundario}>
                  Limpiar filtros
                </Link>
              )
            }
          >
            No hay viajes con estos filtros.
          </Vacio>
        ) : (
          <>
            {/* Tarjetas hasta lg: con el sidebar, la tabla de 11 columnas no cabe antes. */}
            <ul className="space-y-2.5 p-3 sm:p-4 lg:hidden">
              {filas.map((f) => (
                <li
                  key={f.id}
                  className={`relative overflow-hidden rounded-xl border-l-4 p-3.5 shadow-tarjeta ring-1 ring-borde ${f.estatus === "Cancelado" ? "" : "bg-superficie"} ${BORDE_ESTATUS[f.estatus]}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-tinta">#{f.pedido}</span>
                    <SelectEstatus
                      estatus={f.estatus}
                      accion={cambiarEstatusViaje.bind(null, f.id)}
                    />
                  </div>
                  <p className="mt-2 font-semibold leading-snug text-tinta">
                    {f.destino}
                    <span className="font-normal text-tenue"> / {f.producto}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-tenue">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Icono nombre="calendario" className="size-3.5 shrink-0" />
                      {formatoFecha(f.fecha)} · Sem. {f.semana} · {f.planta}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Icono nombre="usuario" className="size-3.5 shrink-0" />
                      {f.piloto}
                    </span>
                    <Placa placa={f.placa} />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-borde pt-2.5">
                    <span className="text-lg font-semibold tabular-nums text-tinta">
                      {formatoQ(f.tarifaFlete)}
                    </span>
                    <BotonBorrar
                      accion={borrarViaje.bind(null, f.id)}
                      pregunta={`¿Borrar el pedido ${f.pedido}?`}
                    />
                  </div>
                </li>
              ))}
              <li className="relative overflow-hidden rounded-xl bg-tinta px-4 py-3 text-white">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-plata">
                    Total (sin cancelados)
                  </span>
                  <span className="text-xl font-semibold tabular-nums">{formatoQ(total)}</span>
                </div>
                <div className="franja-marca absolute inset-x-0 bottom-0 h-0.5" />
              </li>
            </ul>

            <div className="hidden overflow-x-auto scrollbar-thin lg:block">
              <table className={claseTabla}>
                <thead className={claseThead}>
                  <tr>
                    <th>Pedido</th>
                    <th>Año</th>
                    <th>Semana</th>
                    <th>Fecha</th>
                    <th>Placa</th>
                    <th>Piloto</th>
                    <th>Planta</th>
                    <th>Destino / Producto</th>
                    <th>Estatus</th>
                    <th className="text-right">Tarifa flete</th>
                    <th>
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr
                      key={f.id}
                      className={`${claseFila} ${f.estatus === "Cancelado" ? "bg-slate-50 text-slate-600" : ""}`}
                    >
                      <td className="font-mono text-[13px] font-semibold text-tinta">{f.pedido}</td>
                      <td className="text-tenue tabular-nums">{f.anio}</td>
                      <td className="text-tenue tabular-nums">{f.semana}</td>
                      <td className="whitespace-nowrap tabular-nums">{formatoFecha(f.fecha)}</td>
                      <td>
                        <Placa placa={f.placa} />
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-2 whitespace-nowrap">
                          <Avatar nombre={f.piloto} />
                          {f.piloto}
                        </span>
                      </td>
                      <td className="text-tenue tabular-nums">{f.planta}</td>
                      <td>
                        <span className="font-medium text-tinta">{f.destino}</span>
                        <span className="text-tenue"> / {f.producto}</span>
                      </td>
                      <td>
                        <SelectEstatus
                          estatus={f.estatus}
                          accion={cambiarEstatusViaje.bind(null, f.id)}
                        />
                      </td>
                      <td className="text-right font-medium tabular-nums">{formatoQ(f.tarifaFlete)}</td>
                      <td className="w-10 text-right">
                        <BotonBorrar
                          accion={borrarViaje.bind(null, f.id)}
                          pregunta={`¿Borrar el pedido ${f.pedido}?`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={claseTotal}>
                    <td colSpan={9} className="text-right">
                      Total (sin cancelados)
                    </td>
                    <td className="text-right text-base tabular-nums">{formatoQ(total)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </Tarjeta>
    </>
  );
}
