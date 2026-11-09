"use server";

import { and, eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { pilotoPorToken } from "@/lib/choferes";
import { db, viajes, type EstatusViaje } from "@/lib/db";

export type Resultado = { ok: boolean; error?: string };

const YA_CAMBIO = "Este viaje ya cambió de estado o no es tuyo; actualiza la pantalla.";

/**
 * Pasa un viaje del chofer de `desde` a `hacia` en un solo UPDATE atómico.
 * El token se vuelve a validar en cada llamada y el WHERE exige que el viaje
 * sea de ese piloto y siga en el estado esperado: un id manipulado, un doble
 * toque o un cambio hecho por la oficina mientras tanto devuelven 0 filas.
 */
async function cambiarEstatus(
  token: unknown,
  viajeId: unknown,
  desde: EstatusViaje,
  hacia: EstatusViaje,
): Promise<Resultado> {
  if (typeof token !== "string" || !Number.isSafeInteger(viajeId) || (viajeId as number) <= 0) {
    return { ok: false, error: YA_CAMBIO };
  }
  try {
    const piloto = await pilotoPorToken(token);
    if (!piloto) {
      return { ok: false, error: "Tu enlace ya no es válido. Pide uno nuevo a la oficina." };
    }
    // Columnas timestamp sin zona: se guarda en UTC explícito (la oficina y
    // Drizzle las leen como UTC), sin depender del TimeZone de la sesión.
    const ahora = sql`(now() at time zone 'utc')`;
    const marca = hacia === "En ruta" ? { enRutaEn: ahora } : { entregadoEn: ahora };
    const filas = await db
      .update(viajes)
      .set({ estatus: hacia, ...marca })
      .where(
        and(
          eq(viajes.id, viajeId as number),
          eq(viajes.pilotoId, piloto.id),
          eq(viajes.estatus, desde),
        ),
      )
      .returning({ id: viajes.id });
    if (filas.length === 0) {
      refresh();
      return { ok: false, error: YA_CAMBIO };
    }
  } catch (e) {
    console.error("No se pudo cambiar el estatus del viaje", e);
    return { ok: false, error: "No se pudo guardar. Intenta de nuevo en un momento." };
  }
  refresh();
  return { ok: true };
}

export async function iniciarRuta(token: string, viajeId: number) {
  return cambiarEstatus(token, viajeId, "Programado", "En ruta");
}

export async function completarViaje(token: string, viajeId: number) {
  return cambiarEstatus(token, viajeId, "En ruta", "Entregado");
}
