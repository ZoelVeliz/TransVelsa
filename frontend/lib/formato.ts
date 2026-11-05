const quetzales = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
});

export const formatoQ = (monto: number) => quetzales.format(monto);

// "2026-09-16" -> "16/09/2026" sin pasar por Date para evitar corrimientos de zona horaria.
export function formatoFecha(iso: string) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

// Año y semana ISO (lunes a domingo), igual que la columna "Semana" del Excel.
export function anioSemana(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  const fecha = new Date(Date.UTC(a, m - 1, d));
  const dia = fecha.getUTCDay() || 7;
  fecha.setUTCDate(fecha.getUTCDate() + 4 - dia);
  const inicio = new Date(Date.UTC(fecha.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((+fecha - +inicio) / 86400000 + 1) / 7);
  return { anio: fecha.getUTCFullYear(), semana };
}

// Lunes y domingo (AAAA-MM-DD) de la semana ISO que contiene la fecha.
export function rangoSemana(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  const fecha = new Date(Date.UTC(a, m - 1, d));
  const dia = fecha.getUTCDay() || 7;
  const correr = (dias: number) =>
    new Date(fecha.getTime() + dias * 86400000).toISOString().slice(0, 10);
  return { lunes: correr(1 - dia), domingo: correr(7 - dia) };
}

export function hoyISO() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Guatemala",
  });
}

const quetzalesCorto = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  notation: "compact",
  maximumFractionDigits: 1,
});

// Para ejes y espacios chicos: "Q31.3 mil".
export const formatoQCorto = (monto: number) => quetzalesCorto.format(monto);
