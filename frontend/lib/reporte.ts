import { and, asc, between, count, desc, eq, inArray, sum } from "drizzle-orm";
import {
  camiones,
  db,
  gastos,
  movimientosPiloto,
  pilotos,
  viajes,
} from "./db";
import { anioSemana, hoyISO } from "./formato";
import { calcularLiquidacion } from "./liquidacion";
import { paramNumero, type Params } from "./filtros";

export type Periodo = { anio: number; desde: number; hasta: number };

export type Semana = {
  semana: number;
  viajes: number;
  ingresos: number;
  diesel: number;
  repuestos: number;
};

// Años con datos (más reciente primero) y el periodo pedido en la URL.
// Por defecto: el año más reciente con datos, semanas 1 a 53.
export async function resolverPeriodo(sp: Params) {
  const [aniosViajes, aniosGastos] = await Promise.all([
    db.selectDistinct({ anio: viajes.anio }).from(viajes),
    db.selectDistinct({ anio: gastos.anio }).from(gastos),
  ]);
  const anios = [
    ...new Set([...aniosViajes, ...aniosGastos].map((a) => a.anio)),
  ].sort((a, b) => b - a);
  const periodo: Periodo = {
    anio: paramNumero(sp, "anio") ?? anios[0] ?? anioSemana(hoyISO()).anio,
    desde: paramNumero(sp, "desde") ?? 1,
    hasta: paramNumero(sp, "hasta") ?? 53,
  };
  return { anios, periodo };
}

export async function obtenerReporte({ anio, desde, hasta }: Periodo) {
  const enRangoViaje = and(eq(viajes.anio, anio), between(viajes.semana, desde, hasta));
  const entregado = and(enRangoViaje, eq(viajes.estatus, "Entregado"));
  const enRangoGasto = and(eq(gastos.anio, anio), between(gastos.semana, desde, hasta));
  const ingresos = sum(viajes.tarifaFlete).mapWith(Number);
  const monto = sum(gastos.monto).mapWith(Number);

  const [
    viajesSemana,
    gastosSemana,
    [pendiente],
    porCamion,
    porDestino,
    porPiloto,
    porResponsable,
  ] = await Promise.all([
    db
      .select({ semana: viajes.semana, viajes: count(), ingresos })
      .from(viajes)
      .where(entregado)
      .groupBy(viajes.semana),
    db
      .select({ semana: gastos.semana, categoria: gastos.categoria, monto })
      .from(gastos)
      .where(enRangoGasto)
      .groupBy(gastos.semana, gastos.categoria),
    db
      .select({ viajes: count(), ingresos })
      .from(viajes)
      .where(and(enRangoViaje, inArray(viajes.estatus, ["Por asignar", "Programado", "En ruta"]))),
    db
      .select({ etiqueta: camiones.placa, viajes: count(), valor: ingresos })
      .from(viajes)
      .innerJoin(camiones, eq(viajes.camionId, camiones.id))
      .where(entregado)
      .groupBy(camiones.placa)
      .orderBy(desc(ingresos)),
    db
      .select({
        destino: viajes.destino,
        producto: viajes.producto,
        viajes: count(),
        valor: ingresos,
      })
      .from(viajes)
      .where(entregado)
      .groupBy(viajes.destino, viajes.producto)
      .orderBy(desc(ingresos)),
    db
      .select({ etiqueta: pilotos.nombre, viajes: count(), valor: ingresos })
      .from(viajes)
      .innerJoin(pilotos, eq(viajes.pilotoId, pilotos.id))
      .where(entregado)
      .groupBy(pilotos.nombre)
      .orderBy(desc(count())),
    db
      .select({ etiqueta: gastos.pagadoPor, valor: monto })
      .from(gastos)
      .where(enRangoGasto)
      .groupBy(gastos.pagadoPor)
      .orderBy(asc(gastos.pagadoPor)),
  ]);

  // Une viajes y gastos en una fila por semana.
  const mapa = new Map<number, Semana>();
  const fila = (semana: number) => {
    if (!mapa.has(semana))
      mapa.set(semana, { semana, viajes: 0, ingresos: 0, diesel: 0, repuestos: 0 });
    return mapa.get(semana)!;
  };
  for (const v of viajesSemana)
    Object.assign(fila(v.semana), { viajes: v.viajes, ingresos: v.ingresos });
  for (const g of gastosSemana)
    fila(g.semana)[g.categoria === "Diesel" ? "diesel" : "repuestos"] += g.monto;
  const semanas = [...mapa.values()].sort((a, b) => a.semana - b.semana);

  const total = semanas.reduce(
    (t, s) => ({
      viajes: t.viajes + s.viajes,
      ingresos: t.ingresos + s.ingresos,
      diesel: t.diesel + s.diesel,
      repuestos: t.repuestos + s.repuestos,
    }),
    { viajes: 0, ingresos: 0, diesel: 0, repuestos: 0 },
  );
  const gastosTotal = total.diesel + total.repuestos;
  const resultado = total.ingresos - gastosTotal;

  return {
    semanas,
    total: {
      ...total,
      gastos: gastosTotal,
      resultado,
      margen: total.ingresos ? Math.round((resultado / total.ingresos) * 100) : 0,
    },
    pendiente: { viajes: pendiente.viajes, ingresos: pendiente.ingresos ?? 0 },
    porCamion,
    porDestino,
    porPiloto,
    porResponsable,
  };
}

export type Reporte = Awaited<ReturnType<typeof obtenerReporte>>;

const SIN_VIAJES = { cantidadViajes: 0, pagoViajes: 0 };

// Detalle fila por fila para el Excel: viajes, gastos y liquidación de pilotos.
export async function obtenerDetalle({ anio, desde, hasta }: Periodo) {
  const [listaViajes, listaGastos, listaPilotos, viajesPorPiloto, movimientos] =
    await Promise.all([
      db
        .select({
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
          pagoChofer: viajes.pagoChofer,
        })
        .from(viajes)
        .leftJoin(camiones, eq(viajes.camionId, camiones.id))
        .leftJoin(pilotos, eq(viajes.pilotoId, pilotos.id))
        .where(and(eq(viajes.anio, anio), between(viajes.semana, desde, hasta)))
        .orderBy(asc(viajes.fecha), asc(viajes.id)),
      db
        .select()
        .from(gastos)
        .where(and(eq(gastos.anio, anio), between(gastos.semana, desde, hasta)))
        .orderBy(asc(gastos.categoria), asc(gastos.fecha), asc(gastos.id)),
      db.select().from(pilotos).where(eq(pilotos.activo, true)).orderBy(asc(pilotos.nombre)),
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
        ),
    ]);

  const liquidaciones = listaPilotos.map((p) => ({
    piloto: p.nombre,
    ...calcularLiquidacion(
      p,
      viajesPorPiloto.find((v) => v.pilotoId === p.id) ?? SIN_VIAJES,
      movimientos.filter((m) => m.pilotoId === p.id),
    ),
  }));

  return { viajes: listaViajes, gastos: listaGastos, liquidaciones };
}
