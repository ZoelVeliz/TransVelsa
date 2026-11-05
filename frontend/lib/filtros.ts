export type Params = Record<string, string | string[] | undefined>;

export function param(sp: Params, clave: string) {
  const v = sp[clave];
  return (Array.isArray(v) ? v[0] : v) || undefined;
}

export function paramNumero(sp: Params, clave: string) {
  const v = Number(param(sp, clave));
  return Number.isInteger(v) && v > 0 ? v : undefined;
}

// Fecha "AAAA-MM-DD" tal como la envía un <input type="date">.
export function paramFecha(sp: Params, clave: string) {
  const v = param(sp, clave);
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
}

export const TAMANOS_PAGINA = [5, 10, 20] as const;

// Página actual y tamaño de página desde la URL. `clave` permite paginar
// varias tablas en la misma página (p. ej. Diésel y Repuestos).
export function paginacion(sp: Params, clave = "pagina") {
  const n = paramNumero(sp, "porPagina");
  const porPagina = TAMANOS_PAGINA.find((t) => t === n) ?? 20;
  const pagina = paramNumero(sp, clave) ?? 1;
  return { pagina, porPagina, offset: (pagina - 1) * porPagina };
}

// Misma URL con algunos parámetros cambiados (undefined los quita).
export function urlCon(
  ruta: string,
  sp: Params,
  cambios: Record<string, string | number | undefined>,
) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const valor = Array.isArray(v) ? v[0] : v;
    if (valor) q.set(k, valor);
  }
  for (const [k, v] of Object.entries(cambios)) {
    if (v === undefined || v === "") q.delete(k);
    else q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `${ruta}?${s}` : ruta;
}
