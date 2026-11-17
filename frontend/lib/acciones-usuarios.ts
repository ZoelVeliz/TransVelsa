"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { hashPassword, passwordTemporal, problemaPassword, verificarPassword } from "./contrasenas";
import { db, usuarios } from "./db";
import { abrirSesion, cerrarSesionesDe, exigirAdmin, exigirSesion, SinSesion } from "./sesion";

/** `temporal`: contraseña recién generada, para mostrarla una sola vez. */
export type EstadoUsuario = { error?: string; ok?: boolean; mensaje?: string; temporal?: string };

const FORMATO_USUARIO = /^[a-z0-9][a-z0-9._-]{2,29}$/;

class ErrorUsuario extends Error {}

async function manejar(fn: () => Promise<EstadoUsuario | void>): Promise<EstadoUsuario> {
  try {
    const r = await fn();
    refresh();
    return r ?? { ok: true };
  } catch (e) {
    if (e instanceof ErrorUsuario || e instanceof SinSesion) return { error: e.message };
    const msg = String((e as { cause?: { message?: string } }).cause?.message ?? e);
    if (msg.includes("duplicate key")) return { error: "Ese nombre de usuario ya existe." };
    throw e;
  }
}

/** Al menos un admin activo debe quedar siempre (si no, nadie podría crear cuentas). */
async function quedaOtroAdmin(sinContar: number) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(usuarios)
    .where(and(eq(usuarios.esAdmin, true), eq(usuarios.activo, true), ne(usuarios.id, sinContar)));
  return n > 0;
}

const idValido = (id: unknown): id is number => Number.isSafeInteger(id) && (id as number) > 0;

// ---- Solo administradores ----

/** Crea la cuenta con una contraseña temporal que se muestra una sola vez. */
export async function crearUsuario(_: EstadoUsuario, form: FormData): Promise<EstadoUsuario> {
  return manejar(async () => {
    await exigirAdmin();
    const usuario = String(form.get("usuario") ?? "").trim().toLowerCase();
    const nombre = String(form.get("nombre") ?? "").trim();
    if (!FORMATO_USUARIO.test(usuario)) {
      throw new ErrorUsuario("El usuario debe tener de 3 a 30 letras minúsculas, números, punto, guion o guion bajo.");
    }
    if (!nombre || nombre.length > 80) throw new ErrorUsuario("Escribe el nombre de la persona.");
    const temporal = passwordTemporal();
    await db.insert(usuarios).values({
      usuario,
      nombre,
      passwordHash: await hashPassword(temporal),
      esAdmin: form.get("esAdmin") === "on",
    });
    return {
      ok: true,
      mensaje: `Cuenta “${usuario}” creada. Copia la contraseña temporal ahora: no se vuelve a mostrar. La persona puede cambiarla en Usuarios › Mi cuenta.`,
      temporal,
    };
  });
}

export async function cambiarActivoUsuario(id: number, activo: boolean) {
  return manejar(async () => {
    const yo = await exigirAdmin();
    if (!idValido(id)) throw new ErrorUsuario("Usuario no válido.");
    if (id === yo.id && !activo) throw new ErrorUsuario("No puedes desactivar tu propia cuenta.");
    if (!activo && !(await quedaOtroAdmin(id))) throw new ErrorUsuario("Debe quedar al menos un administrador activo.");
    await db.update(usuarios).set({ activo }).where(eq(usuarios.id, id));
    if (!activo) await cerrarSesionesDe(id);
  });
}

export async function cambiarAdminUsuario(id: number, esAdmin: boolean) {
  return manejar(async () => {
    const yo = await exigirAdmin();
    if (!idValido(id)) throw new ErrorUsuario("Usuario no válido.");
    if (id === yo.id && !esAdmin) throw new ErrorUsuario("No puedes quitarte a ti mismo el rol de administrador.");
    if (!esAdmin && !(await quedaOtroAdmin(id))) throw new ErrorUsuario("Debe quedar al menos un administrador activo.");
    await db.update(usuarios).set({ esAdmin }).where(eq(usuarios.id, id));
  });
}

/** Nueva contraseña temporal; cierra las sesiones abiertas y quita el bloqueo. */
export async function restablecerPasswordUsuario(id: number): Promise<EstadoUsuario> {
  return manejar(async () => {
    const yo = await exigirAdmin();
    if (!idValido(id)) throw new ErrorUsuario("Usuario no válido.");
    if (id === yo.id) throw new ErrorUsuario("Para tu propia cuenta usa “Cambiar mi contraseña”.");
    const temporal = passwordTemporal();
    const filas = await db
      .update(usuarios)
      .set({ passwordHash: await hashPassword(temporal), intentosFallidos: 0, bloqueadoHasta: null })
      .where(eq(usuarios.id, id))
      .returning({ usuario: usuarios.usuario });
    if (filas.length === 0) throw new ErrorUsuario("Ese usuario ya no existe.");
    await cerrarSesionesDe(id);
    return { ok: true, mensaje: `Contraseña temporal nueva para “${filas[0].usuario}”. Cópiala ahora: no se vuelve a mostrar.`, temporal };
  });
}

// ---- Cualquier usuario con sesión ----

export async function cambiarMiPassword(_: EstadoUsuario, form: FormData): Promise<EstadoUsuario> {
  return manejar(async () => {
    const yo = await exigirSesion();
    const actual = String(form.get("actual") ?? "");
    const nueva = String(form.get("nueva") ?? "");
    const repetida = String(form.get("repetida") ?? "");
    const problema = problemaPassword(nueva);
    if (problema) throw new ErrorUsuario(problema);
    if (nueva !== repetida) throw new ErrorUsuario("La contraseña nueva no coincide en los dos campos.");
    if (nueva === actual) throw new ErrorUsuario("La contraseña nueva debe ser distinta de la actual.");
    const [cuenta] = await db.select({ hash: usuarios.passwordHash }).from(usuarios).where(eq(usuarios.id, yo.id));
    if (!cuenta || !(await verificarPassword(actual, cuenta.hash))) {
      throw new ErrorUsuario("La contraseña actual no es correcta.");
    }
    await db.update(usuarios).set({ passwordHash: await hashPassword(nueva) }).where(eq(usuarios.id, yo.id));
    // Cierra la sesión en otros dispositivos; esta sigue abierta porque se vuelve a abrir abajo.
    await cerrarSesionesDe(yo.id);
    await abrirSesion(yo.id);
    return { ok: true, mensaje: "Contraseña cambiada. Se cerró la sesión en tus otros dispositivos." };
  });
}
