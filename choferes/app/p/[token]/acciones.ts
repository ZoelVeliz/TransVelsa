"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db, tarifas, viajes } from "@/lib/db";
import { anioSemana } from "@/lib/fechas";
import { tokenPedidosValido } from "@/lib/pedidos";

export type EstadoPedido = { ok?: boolean; error?: string; pedido?: string };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const campo = (form: FormData, nombre: string) => String(form.get(nombre) ?? "").trim();

/**
 * Crea un viaje "Por asignar": sin camión ni piloto, que pone la oficina.
 * El flete y el pago del chofer se copian del tarifario, igual que en la oficina.
 */
export async function crearPedido(token: string, _: EstadoPedido, form: FormData): Promise<EstadoPedido> {
  if (!tokenPedidosValido(token)) {
    return { error: "Este enlace ya no es válido. Pide uno nuevo a TransVelsa." };
  }
  const pedido = campo(form, "pedido");
  const fecha = campo(form, "fecha");
  const planta = campo(form, "planta").toUpperCase();
  const tarifaId = Number(campo(form, "tarifaId"));
  if (!pedido) return { error: "Escribe el número de pedido." };
  if (pedido.length > 60) return { error: "El número de pedido es demasiado largo." };
  if (!FECHA.test(fecha) || Number.isNaN(Date.parse(fecha))) return { error: "Elige una fecha válida." };
  if (!planta) return { error: "Escribe la planta." };
  if (!Number.isSafeInteger(tarifaId)) return { error: "Elige el destino." };

  try {
    const [tarifa] = await db.select().from(tarifas).where(eq(tarifas.id, tarifaId)).limit(1);
    if (!tarifa) return { error: "Ese destino ya no existe. Actualiza la pantalla." };
    await db.insert(viajes).values({
      pedido,
      fecha,
      ...anioSemana(fecha),
      planta,
      destino: tarifa.destino,
      producto: tarifa.producto,
      tarifaFlete: tarifa.monto,
      pagoChofer: tarifa.pagoChofer,
      estatus: "Por asignar",
    });
  } catch (e) {
    const msg = String((e as { cause?: { message?: string } }).cause?.message ?? e);
    if (msg.includes("duplicate key")) return { error: `El pedido ${pedido} ya está registrado.` };
    console.error("No se pudo crear el pedido", e);
    return { error: "No se pudo guardar. Intenta de nuevo en un momento." };
  }
  refresh();
  return { ok: true, pedido };
}
