// Fechas como texto AAAA-MM-DD, siempre en hora de Guatemala.

export function hoyISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Guatemala" });
}

export function sumarDias(iso: string, dias: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

// "2026-09-16" -> "16/09/2026" sin pasar por Date (evita corrimientos de zona).
export function formatoFecha(iso: string) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// "2026-11-09" -> "lunes 9 de noviembre"
export function fechaLarga(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  const dia = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return `${DIAS[dia]} ${d} de ${MESES[m - 1]}`;
}

// Etiqueta corta relativa a hoy: "Hoy", "Mañana", "Ayer" o null.
export function etiquetaDia(iso: string, hoy: string) {
  if (iso === hoy) return "Hoy";
  if (iso === sumarDias(hoy, 1)) return "Mañana";
  if (iso === sumarDias(hoy, -1)) return "Ayer";
  return null;
}

// Año y semana ISO (lunes a domingo), igual que la oficina (frontend/lib/formato.ts).
export function anioSemana(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  const fecha = new Date(Date.UTC(a, m - 1, d));
  const dia = fecha.getUTCDay() || 7;
  fecha.setUTCDate(fecha.getUTCDate() + 4 - dia);
  const inicio = new Date(Date.UTC(fecha.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((+fecha - +inicio) / 86400000 + 1) / 7);
  return { anio: fecha.getUTCFullYear(), semana };
}
