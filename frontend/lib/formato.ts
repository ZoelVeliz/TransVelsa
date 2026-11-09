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

// Quincena (1 al 15, o 16 a fin de mes) que contiene la fecha. `correr` mueve
// tantas quincenas hacia atrás (-1) o adelante (+1).
export function rangoQuincena(iso: string, correr = 0) {
  const [a, m, d] = iso.split("-").map(Number);
  const indice = (a * 12 + (m - 1)) * 2 + (d > 15 ? 1 : 0) + correr;
  const mes = Math.floor(indice / 2);
  const anio = Math.floor(mes / 12);
  const mm = String((mes % 12) + 1).padStart(2, "0");
  const ultimo = new Date(Date.UTC(anio, (mes % 12) + 1, 0)).getUTCDate();
  return indice % 2 === 0
    ? { desde: `${anio}-${mm}-01`, hasta: `${anio}-${mm}-15` }
    : { desde: `${anio}-${mm}-16`, hasta: `${anio}-${mm}-${ultimo}` };
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// "2026-11-01", "2026-11-15" -> "1 al 15 nov 2026"; abrevia lo que se repite.
export function textoRango(desde: string, hasta: string) {
  const [a1, m1, d1] = desde.split("-").map(Number);
  const [a2, m2, d2] = hasta.split("-").map(Number);
  const fin = `${d2} ${MESES[m2 - 1]} ${a2}`;
  if (desde === hasta) return fin;
  if (a1 !== a2) return `${d1} ${MESES[m1 - 1]} ${a1} al ${fin}`;
  if (m1 !== m2) return `${d1} ${MESES[m1 - 1]} al ${fin}`;
  return `${d1} al ${fin}`;
}

export function hoyISO() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Guatemala",
  });
}

const horaGuatemala = new Intl.DateTimeFormat("es-GT", {
  timeZone: "America/Guatemala",
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "2-digit",
  hourCycle: "h23",
});

// Momento exacto -> "14:05 16/11" en hora de Guatemala.
export function horaFecha(momento: Date) {
  const p = Object.fromEntries(horaGuatemala.formatToParts(momento).map((x) => [x.type, x.value]));
  const dos = (v: string) => v.padStart(2, "0");
  return `${dos(p.hour)}:${dos(p.minute)} ${dos(p.day)}/${dos(p.month)}`;
}

const quetzalesCorto = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  notation: "compact",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

// Para ejes y espacios chicos: "Q31.3 mil".
export const formatoQCorto = (monto: number) => quetzalesCorto.format(monto);

// "1 viaje", "3 viajes".
export const cantidad = (n: number, uno: string, varios: string) =>
  `${n} ${n === 1 ? uno : varios}`;
