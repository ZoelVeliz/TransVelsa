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
