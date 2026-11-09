import { and, eq } from "drizzle-orm";
import { cache } from "react";
import { db, pilotos } from "./db";

// Mismo formato que genera la oficina: 32+ caracteres url-safe.
const FORMATO_TOKEN = /^[A-Za-z0-9_-]{32,128}$/;

export const tokenConFormato = (token: string) => FORMATO_TOKEN.test(token);

/**
 * Piloto activo dueño del token, o null. Un token mal formado se rechaza sin
 * consultar la base. Desconocido e inactivo dan el mismo resultado a propósito
 * (no se revela cuál de los dos es).
 */
export const pilotoPorToken = cache(async (token: string) => {
  if (!tokenConFormato(token)) return null;
  try {
    const [piloto] = await db
      .select({ id: pilotos.id, nombre: pilotos.nombre })
      .from(pilotos)
      .where(and(eq(pilotos.token, token), eq(pilotos.activo, true)))
      .limit(1);
    return piloto ?? null;
  } catch {
    // El error de Drizzle trae los parámetros de la consulta (el token) en su
    // mensaje: se reemplaza para que el token no quede en los logs del servidor.
    throw new Error("No se pudo validar el enlace del chofer");
  }
});
