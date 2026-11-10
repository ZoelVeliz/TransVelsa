"use server";

import { randomBytes } from "node:crypto";
import { and, eq, isNotNull } from "drizzle-orm";
import { refresh } from "next/cache";
import {
  CATEGORIAS_GASTO,
  ESTATUS_ASIGNADO,
  RESPONSABLES,
  TIPOS_MOVIMIENTO,
  TIPOS_MOVIMIENTO_CAJA,
} from "./constantes";
import {
  camiones,
  db,
  gastos,
  movimientosCaja,
  movimientosPiloto,
  pilotos,
  tarifas,
  viajes,
} from "./db";
import { anioSemana } from "./formato";

export type Estado = { error?: string; ok?: boolean };

function texto(form: FormData, campo: string) {
  const valor = String(form.get(campo) ?? "").trim();
  if (!valor) throw new ErrorCampo(`Falta el campo "${campo}"`);
  return valor;
}

function numero(form: FormData, campo: string) {
  const valor = Number(texto(form, campo));
  if (!Number.isFinite(valor) || valor < 0)
    throw new ErrorCampo(`"${campo}" debe ser un número válido`);
  return valor;
}

function opcion<T extends readonly string[]>(
  form: FormData,
  campo: string,
  opciones: T,
): T[number] {
  const valor = texto(form, campo);
  if (!opciones.includes(valor))
    throw new ErrorCampo(`"${campo}" no es válido`);
  return valor;
}

class ErrorCampo extends Error {}

// Envuelve una mutación para devolver errores al formulario en vez de romper la página.
async function ejecutar(fn: () => Promise<unknown>): Promise<Estado> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof ErrorCampo) return { error: e.message };
    const msg = String((e as { cause?: { message?: string } }).cause?.message ?? e);
    if (msg.includes("duplicate key")) return { error: "Ese registro ya existe" };
    if (msg.includes("foreign key"))
      return { error: "No se puede borrar: tiene registros asociados" };
    throw e;
  }
  refresh();
  return { ok: true };
}

// ---- Viajes ----

export async function crearViaje(_: Estado, form: FormData) {
  return ejecutar(async () => {
    const fecha = texto(form, "fecha");
    const [tarifa] = await db
      .select()
      .from(tarifas)
      .where(eq(tarifas.id, numero(form, "tarifaId")));
    if (!tarifa) throw new ErrorCampo("Selecciona un destino del tarifario");
    await db.insert(viajes).values({
      pedido: texto(form, "pedido"),
      fecha,
      ...anioSemana(fecha),
      camionId: numero(form, "camionId"),
      pilotoId: numero(form, "pilotoId"),
      planta: texto(form, "planta"),
      destino: tarifa.destino,
      producto: tarifa.producto,
      tarifaFlete: tarifa.monto,
      pagoChofer: tarifa.pagoChofer,
      estatus: opcion(form, "estatus", ESTATUS_ASIGNADO),
    });
  });
}

// Da camión y piloto a un viaje "Por asignar" y lo deja Programado. El WHERE
// exige que siga por asignar: si otra persona ya lo asignó, no se pisa.
export async function asignarViaje(id: number, _: Estado, form: FormData) {
  return ejecutar(async () => {
    const filas = await db
      .update(viajes)
      .set({
        camionId: numero(form, "camionId"),
        pilotoId: numero(form, "pilotoId"),
        estatus: "Programado",
      })
      .where(and(eq(viajes.id, id), eq(viajes.estatus, "Por asignar")))
      .returning({ id: viajes.id });
    if (filas.length === 0) throw new ErrorCampo("Este viaje ya fue asignado o borrado");
  });
}

// en_ruta_en / entregado_en solo los pone la app del chofer. Si la oficina pone
// el viaje En ruta o Entregado a mano, se borra esa hora para que la lista no
// diga "desde la app" por un cambio que hizo la oficina.
// Un viaje sin piloto no cambia de estatus aquí: primero se asigna (asignarViaje).
export async function cambiarEstatusViaje(id: number, estatus: string) {
  if (!ESTATUS_ASIGNADO.includes(estatus as never)) return;
  await db
    .update(viajes)
    .set({
      estatus: estatus as (typeof ESTATUS_ASIGNADO)[number],
      ...(estatus === "En ruta" && { enRutaEn: null }),
      ...(estatus === "Entregado" && { entregadoEn: null }),
    })
    .where(and(eq(viajes.id, id), isNotNull(viajes.pilotoId)));
  refresh();
}

export async function borrarViaje(id: number) {
  await db.delete(viajes).where(eq(viajes.id, id));
  refresh();
}

// ---- Gastos ----

export async function crearGasto(_: Estado, form: FormData) {
  return ejecutar(async () => {
    const fecha = texto(form, "fecha");
    const calculada = anioSemana(fecha);
    const semana = form.get("semana") ? numero(form, "semana") : calculada.semana;
    await db.insert(gastos).values({
      categoria: opcion(form, "categoria", CATEGORIAS_GASTO),
      fecha,
      anio: calculada.anio,
      semana,
      descripcion: texto(form, "descripcion"),
      monto: numero(form, "monto"),
      pagadoPor: opcion(
        form,
        "pagadoPor",
        RESPONSABLES.map((r) => r.nombre),
      ),
    });
  });
}

export async function borrarGasto(id: number) {
  await db.delete(gastos).where(eq(gastos.id, id));
  refresh();
}

// ---- Tarifario, pilotos y camiones ----

export async function crearTarifa(_: Estado, form: FormData) {
  return ejecutar(() =>
    db.insert(tarifas).values({
      destino: texto(form, "destino"),
      producto: texto(form, "producto"),
      monto: numero(form, "monto"),
      pagoChofer: numero(form, "pagoChofer"),
    }),
  );
}

export async function actualizarMontoTarifa(id: number, monto: number) {
  if (!Number.isFinite(monto) || monto < 0) return;
  await db.update(tarifas).set({ monto }).where(eq(tarifas.id, id));
  refresh();
}

// Igual que el flete: solo afecta a los viajes que se registren después.
export async function actualizarPagoChoferTarifa(id: number, pagoChofer: number) {
  if (!Number.isFinite(pagoChofer) || pagoChofer < 0) return;
  await db.update(tarifas).set({ pagoChofer }).where(eq(tarifas.id, id));
  refresh();
}

export async function borrarTarifa(id: number) {
  await db.delete(tarifas).where(eq(tarifas.id, id));
  refresh();
}

export async function crearPiloto(_: Estado, form: FormData) {
  return ejecutar(() =>
    db.insert(pilotos).values({
      nombre: texto(form, "nombre"),
      viaticoPorViaje: numero(form, "viaticoPorViaje"),
      base: numero(form, "base"),
    }),
  );
}

// Enlace personal a la app de choferes (/c/<token>). Crear uno nuevo
// reemplaza el anterior, que deja de funcionar.
export async function generarEnlaceChofer(pilotoId: number) {
  if (!Number.isInteger(pilotoId)) return;
  await db
    .update(pilotos)
    .set({ token: randomBytes(24).toString("base64url") })
    .where(eq(pilotos.id, pilotoId));
  refresh();
}

export async function quitarEnlaceChofer(pilotoId: number) {
  if (!Number.isInteger(pilotoId)) return;
  await db.update(pilotos).set({ token: null }).where(eq(pilotos.id, pilotoId));
  refresh();
}

export async function crearCamion(_: Estado, form: FormData) {
  return ejecutar(() =>
    db.insert(camiones).values({ placa: texto(form, "placa").toUpperCase() }),
  );
}

export async function crearMovimiento(_: Estado, form: FormData) {
  return ejecutar(async () => {
    const fecha = texto(form, "fecha");
    await db.insert(movimientosPiloto).values({
      pilotoId: numero(form, "pilotoId"),
      tipo: opcion(form, "tipo", TIPOS_MOVIMIENTO),
      fecha,
      ...anioSemana(fecha),
      monto: numero(form, "monto"),
      descripcion: String(form.get("descripcion") ?? "").trim() || null,
    });
  });
}

export async function borrarMovimiento(id: number) {
  await db.delete(movimientosPiloto).where(eq(movimientosPiloto.id, id));
  refresh();
}

// ---- Caja y cuentas ----

export async function crearMovimientoCaja(_: Estado, form: FormData) {
  return ejecutar(async () => {
    const cuentas = RESPONSABLES.map((r) => r.nombre);
    const cuenta = opcion(form, "cuenta", cuentas);
    const tipo = opcion(form, "tipo", TIPOS_MOVIMIENTO_CAJA);
    const monto = numero(form, "monto");
    if (monto <= 0) throw new ErrorCampo("El monto debe ser mayor que cero");
    let cuentaDestino: string | null = null;
    if (tipo === "Transferencia") {
      if (!form.get("cuentaDestino"))
        throw new ErrorCampo("Elige a qué cuenta va la transferencia");
      cuentaDestino = opcion(form, "cuentaDestino", cuentas);
      if (cuentaDestino === cuenta)
        throw new ErrorCampo("La transferencia debe ir a otra cuenta");
    }
    await db.insert(movimientosCaja).values({
      fecha: texto(form, "fecha"),
      cuenta,
      tipo,
      monto,
      cuentaDestino,
      descripcion: texto(form, "descripcion"),
    });
  });
}

export async function borrarMovimientoCaja(id: number) {
  await db.delete(movimientosCaja).where(eq(movimientosCaja.id, id));
  refresh();
}
