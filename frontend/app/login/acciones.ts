"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { gastarTiempoComoVerificacion, MAX_PASSWORD, verificarPassword } from "@/lib/contrasenas";
import { db, usuarios } from "@/lib/db";
import { abrirSesion, cerrarSesionActual } from "@/lib/sesion";

export type EstadoLogin = { error?: string; usuario?: string };

const MAX_INTENTOS = 5;
const BLOQUEO_MIN = 15;
const ERROR_GENERICO = "Usuario o contraseña incorrectos.";

/** Solo rutas internas ("/gastos?x=1"); nunca "//otro-sitio" ni URLs completas. */
function destinoSeguro(volver: FormDataEntryValue | null) {
  const v = typeof volver === "string" ? volver : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") && !v.startsWith("/login") ? v : "/viajes";
}

export async function iniciarSesion(_: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const nombreUsuario = String(form.get("usuario") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!nombreUsuario || !password) return { error: "Escribe tu usuario y tu contraseña.", usuario: nombreUsuario };
  if (password.length > MAX_PASSWORD) return { error: ERROR_GENERICO, usuario: nombreUsuario };

  const [cuenta] = await db.select().from(usuarios).where(eq(usuarios.usuario, nombreUsuario)).limit(1);
  if (!cuenta) {
    // Mismo tiempo de respuesta que con un usuario real: no delata cuáles existen.
    await gastarTiempoComoVerificacion(password);
    return { error: ERROR_GENERICO, usuario: nombreUsuario };
  }

  const ahora = Date.now();
  if (cuenta.bloqueadoHasta && cuenta.bloqueadoHasta.getTime() > ahora) {
    const minutos = Math.ceil((cuenta.bloqueadoHasta.getTime() - ahora) / 60_000);
    return {
      error: `Demasiados intentos fallidos. Espera ${minutos} min e intenta de nuevo.`,
      usuario: nombreUsuario,
    };
  }

  const correcta = await verificarPassword(password, cuenta.passwordHash);
  if (!correcta) {
    const intentos = cuenta.intentosFallidos + 1;
    const bloquear = intentos >= MAX_INTENTOS;
    await db
      .update(usuarios)
      .set({
        intentosFallidos: bloquear ? 0 : intentos,
        bloqueadoHasta: bloquear ? new Date(ahora + BLOQUEO_MIN * 60_000) : cuenta.bloqueadoHasta,
      })
      .where(eq(usuarios.id, cuenta.id));
    return {
      error: bloquear
        ? `Demasiados intentos fallidos. La cuenta queda bloqueada ${BLOQUEO_MIN} minutos.`
        : ERROR_GENERICO,
      usuario: nombreUsuario,
    };
  }

  // Contraseña correcta pero cuenta desactivada: se dice claro (ya probó que es suya).
  if (!cuenta.activo) return { error: "Tu cuenta está desactivada. Habla con un administrador.", usuario: nombreUsuario };

  await db
    .update(usuarios)
    .set({ intentosFallidos: 0, bloqueadoHasta: null, ultimoAcceso: new Date() })
    .where(eq(usuarios.id, cuenta.id));
  await abrirSesion(cuenta.id);
  redirect(destinoSeguro(form.get("volver")));
}

export async function cerrarSesion() {
  await cerrarSesionActual();
  redirect("/login");
}
