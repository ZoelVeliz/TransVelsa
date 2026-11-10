import { createHash, timingSafeEqual } from "node:crypto";

const hash = (texto: string) => createHash("sha256").update(texto).digest();

/**
 * La pantalla de pedidos (/p/<token>) tiene un solo enlace secreto, guardado en
 * PEDIDOS_TOKEN. Sin la variable (o con una clave corta) la pantalla queda
 * apagada. Se comparan los hashes para no revelar nada por el tiempo de respuesta.
 */
export function tokenPedidosValido(token: unknown) {
  const esperado = process.env.PEDIDOS_TOKEN?.trim();
  if (!esperado || esperado.length < 32 || typeof token !== "string") return false;
  return timingSafeEqual(hash(token), hash(esperado));
}
