import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, sesiones, usuarios } from "./db";

/**
 * Sesiones de la oficina guardadas en la base (tabla `sesiones`).
 * La cookie lleva un token aleatorio de 256 bits; la base guarda solo su
 * SHA-256. Desactivar un usuario o borrar sus sesiones lo saca al instante.
 */

export const COOKIE_SESION = "tv_sesion";
export const DURACION_SESION_S = 60 * 60 * 24 * 30; // 30 días

export type UsuarioSesion = { id: number; usuario: string; nombre: string; esAdmin: boolean };

const FORMATO_TOKEN = /^[A-Za-z0-9_-]{43}$/;
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Usuario dueño del token, o null (token mal formado, vencido, o usuario inactivo). */
export async function usuarioDeToken(token: string | undefined): Promise<UsuarioSesion | null> {
  if (!token || !FORMATO_TOKEN.test(token)) return null;
  const [fila] = await db
    .select({
      id: usuarios.id,
      usuario: usuarios.usuario,
      nombre: usuarios.nombre,
      esAdmin: usuarios.esAdmin,
      activo: usuarios.activo,
      vence: sesiones.vence,
    })
    .from(sesiones)
    .innerJoin(usuarios, eq(usuarios.id, sesiones.usuarioId))
    .where(eq(sesiones.tokenHash, hashToken(token)))
    .limit(1);
  if (!fila || !fila.activo || fila.vence.getTime() <= Date.now()) return null;
  return { id: fila.id, usuario: fila.usuario, nombre: fila.nombre, esAdmin: fila.esAdmin };
}

/** Abre una sesión nueva para el usuario y deja la cookie puesta. */
export async function abrirSesion(usuarioId: number) {
  const token = randomBytes(32).toString("base64url");
  const vence = new Date(Date.now() + DURACION_SESION_S * 1000);
  await db.insert(sesiones).values({ tokenHash: hashToken(token), usuarioId, vence });
  // De paso, limpia las sesiones vencidas de este usuario.
  await db.delete(sesiones).where(and(eq(sesiones.usuarioId, usuarioId), lt(sesiones.vence, new Date())));
  (await cookies()).set(COOKIE_SESION, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_S,
  });
}

/** Cierra la sesión actual (borra la fila y la cookie). */
export async function cerrarSesionActual() {
  const almacen = await cookies();
  const token = almacen.get(COOKIE_SESION)?.value;
  if (token && FORMATO_TOKEN.test(token)) await db.delete(sesiones).where(eq(sesiones.tokenHash, hashToken(token)));
  almacen.delete(COOKIE_SESION);
}

/** Cierra todas las sesiones de un usuario (al desactivarlo o cambiarle la contraseña). */
export async function cerrarSesionesDe(usuarioId: number) {
  await db.delete(sesiones).where(eq(sesiones.usuarioId, usuarioId));
}

export async function usuarioActual() {
  return usuarioDeToken((await cookies()).get(COOKIE_SESION)?.value);
}

export class SinSesion extends Error {
  constructor(mensaje = "Tu sesión venció. Vuelve a entrar.") {
    super(mensaje);
  }
}

/**
 * Candado para cada Server Action y Route Handler de la oficina: son endpoints
 * públicos aunque la página esté protegida, así que se revisa aquí también.
 */
export async function exigirSesion() {
  const usuario = await usuarioActual();
  if (!usuario) throw new SinSesion();
  return usuario;
}

export async function exigirAdmin() {
  const usuario = await exigirSesion();
  if (!usuario.esAdmin) throw new SinSesion("Solo un administrador puede hacer esto.");
  return usuario;
}
