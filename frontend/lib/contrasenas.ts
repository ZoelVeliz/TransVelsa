import { randomBytes, randomInt, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Hash de contraseñas con scrypt (lento a propósito y con mucha memoria, para
 * que adivinar contraseñas robadas de la base sea carísimo). Formato guardado:
 *   scrypt$<N>$<r>$<p>$<sal base64url>$<hash base64url>
 * Los parámetros van en el texto: si un día se suben, los hashes viejos siguen
 * verificándose con los suyos.
 */

const N = 2 ** 15;
const R = 8;
const P = 1;
const LARGO = 64;
// scrypt necesita ~128·N·r bytes; se da margen.
const MEMORIA = 128 * N * R * 2;

export const MIN_PASSWORD = 10;
export const MAX_PASSWORD = 200;

function derivar(password: string, sal: Buffer, n: number, r: number, p: number) {
  const opciones: ScryptOptions = { N: n, r, p, maxmem: Math.max(MEMORIA, 128 * n * r * 2) };
  return new Promise<Buffer>((ok, mal) =>
    scrypt(password.normalize("NFKC"), sal, LARGO, opciones, (e, clave) => (e ? mal(e) : ok(clave))),
  );
}

export async function hashPassword(password: string) {
  const sal = randomBytes(16);
  const clave = await derivar(password, sal, N, R, P);
  return `scrypt$${N}$${R}$${P}$${sal.toString("base64url")}$${clave.toString("base64url")}`;
}

export async function verificarPassword(password: string, guardado: string) {
  const [alg, n, r, p, sal, hash] = guardado.split("$");
  if (alg !== "scrypt" || !sal || !hash) return false;
  const esperado = Buffer.from(hash, "base64url");
  const clave = await derivar(password, Buffer.from(sal, "base64url"), Number(n), Number(r), Number(p));
  return clave.length === esperado.length && timingSafeEqual(clave, esperado);
}

// Para usuarios que no existen: se calcula igual un hash, así la respuesta tarda
// lo mismo y no delata qué nombres de usuario son reales.
let hashFicticio: Promise<string> | undefined;
export async function gastarTiempoComoVerificacion(password: string) {
  hashFicticio ??= hashPassword(randomBytes(16).toString("hex"));
  await verificarPassword(password, await hashFicticio);
}

/** Mensaje de error, o null si la contraseña sirve. */
export function problemaPassword(password: string) {
  if (password.length < MIN_PASSWORD) return `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`;
  if (password.length > MAX_PASSWORD) return "La contraseña es demasiado larga.";
  return null;
}

/** Contraseña temporal legible (sin 0/O ni 1/l/I) para cuentas nuevas o restablecidas. */
export function passwordTemporal(largo = 14) {
  const letras = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: largo }, () => letras[randomInt(letras.length)]).join("");
}
