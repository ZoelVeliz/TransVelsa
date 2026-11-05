// Carga los datos del Excel de septiembre 2026. Borra todo antes de insertar.
// Uso: npm run db:seed
import {
  camiones,
  db,
  gastos,
  movimientosPiloto,
  pilotos,
  tarifas,
  viajes,
} from "../lib/db";
import { anioSemana } from "../lib/formato";

const conSemana = <T extends { fecha: string }>(fila: T) => ({
  ...fila,
  ...anioSemana(fila.fecha),
});

async function main() {
  await db.delete(movimientosPiloto);
  await db.delete(viajes);
  await db.delete(gastos);
  await db.delete(tarifas);
  await db.delete(camiones);
  await db.delete(pilotos);

  const [jose, taison] = await db
    .insert(pilotos)
    .values([{ nombre: "Jose Rodas" }, { nombre: "Taison" }, { nombre: "Denser" }])
    .returning();

  const [c728, c441] = await db
    .insert(camiones)
    .values([{ placa: "728BYV" }, { placa: "441CCK" }])
    .returning();

  await db.insert(tarifas).values([
    // El Excel paga Q150 por viaje sin importar el destino; ajústalo en el tarifario.
    { destino: "Champas", producto: "Monocapa", monto: 1830, pagoChofer: 150 },
    { destino: "Ferreteria Jalapa", producto: "Monocapa", monto: 2030, pagoChofer: 150 },
    { destino: "Ferreteria Jalapa", producto: "Cemento", monto: 2030, pagoChofer: 150 },
    { destino: "Bodega Industrial Rancho", producto: "Cemento", monto: 1830, pagoChofer: 150 },
  ]);

  const v = (
    pedido: string,
    fecha: string,
    camionId: number,
    destino: string,
    producto: string,
    tarifaFlete: number,
  ) =>
    conSemana({
      pedido,
      fecha,
      camionId,
      pilotoId: jose.id,
      planta: "SM",
      destino,
      producto,
      tarifaFlete,
      estatus: "Entregado" as const,
    });

  await db.insert(viajes).values([
    v("112606227", "2026-09-16", c728.id, "Champas", "Monocapa", 1830),
    v("112606218", "2026-09-16", c441.id, "Ferreteria Jalapa", "Monocapa", 2030),
    v("112609927", "2026-09-18", c441.id, "Ferreteria Jalapa", "Monocapa", 2030),
    v("112609928", "2026-09-18", c441.id, "Ferreteria Jalapa", "Monocapa", 2030),
    v("112611389", "2026-09-21", c728.id, "Champas", "Monocapa", 1830),
    v("112611391", "2026-09-21", c441.id, "Ferreteria Jalapa", "Monocapa", 2030),
    v("112613311", "2026-09-22", c441.id, "Ferreteria Jalapa", "Monocapa", 2030),
    v("112613419", "2026-09-22", c728.id, "Champas", "Monocapa", 1830),
    v("112615820", "2026-09-23", c441.id, "Ferreteria Jalapa", "Monocapa", 2030),
    v("112615821", "2026-09-24", c728.id, "Champas", "Monocapa", 1830),
    v("112617700", "2026-09-25", c441.id, "Ferreteria Jalapa", "Monocapa", 2030),
    v("112554842", "2026-09-26", c441.id, "Bodega Industrial Rancho", "Cemento", 1830),
    v("112573179", "2026-09-28", c441.id, "Ferreteria Jalapa", "Cemento", 2030),
    v("112620942", "2026-09-29", c441.id, "Ferreteria Jalapa", "Monocapa", 2030),
    v("112573185", "2026-09-29", c441.id, "Ferreteria Jalapa", "Cemento", 2030),
    v("112622445", "2026-09-30", c441.id, "Champas", "Monocapa", 1830),
  ]);

  // En el Excel la semana de gastos se puso a mano (p. ej. 28/09 cuenta como
  // semana 39), así que se respeta tal cual en lugar de calcularla.
  const g = (
    categoria: "Diesel" | "Repuestos",
    fecha: string,
    semana: number,
    descripcion: string,
    monto: number,
    pagadoPor: string,
  ) => ({ categoria, fecha, anio: 2026, semana, descripcion, monto, pagadoPor });

  await db.insert(gastos).values([
    g("Diesel", "2026-09-17", 38, "diesel acumulado", 3200, "Zoel"),
    g("Diesel", "2026-09-17", 38, "resto", 250, "Zoel"),
    g("Diesel", "2026-09-18", 38, "gordo y violado", 540, "Zoel"),
    g("Diesel", "2026-09-18", 38, "marlon", 500, "Zoel"),
    g("Diesel", "2026-09-18", 38, "gasolina carro", 150, "Darwin"),
    g("Diesel", "2026-09-19", 38, "gordo", 370, "Zoel"),
    g("Diesel", "2026-09-19", 38, "eliber", 300, "Zoel"),
    g("Diesel", "2026-09-19", 38, "obdulio 770", 360, "Zoel"),
    g("Diesel", "2026-09-20", 38, "cochero", 1100, "Darwin"),
    g("Diesel", "2026-09-22", 39, "cochero", 900, "Darwin"),
    g("Diesel", "2026-09-23", 39, "eliber", 80, "Darwin"),
    g("Diesel", "2026-09-25", 39, "Nuevo cliente", 370, "Darwin"),
    g("Diesel", "2026-09-25", 39, "violado", 1000, "Darwin"),
    g("Diesel", "2026-09-25", 39, "gasolina carro", 200, "Darwin"),
    g("Diesel", "2026-09-25", 39, "gordo", 370, "Darwin"),
    g("Diesel", "2026-09-27", 39, "cochero", 1200, "Mama"),
    g("Diesel", "2026-09-29", 39, "gordo", 70, "Zoel"),
    g("Diesel", "2026-09-28", 39, "Cochero adelantado", 300, "Joelmir"),
    g("Diesel", "2026-09-29", 39, "gordo", 300, "Joelmir"),
    g("Diesel", "2026-09-29", 39, "gasolina carro", 100, "Mama"),
    g("Repuestos", "2026-09-19", 38, "quitada de rach", 225, "Darwin"),
    g("Repuestos", "2026-09-19", 38, "llantas y pinchazo maruca", 2050, "Darwin"),
    g("Repuestos", "2026-09-19", 38, "parqueo", 700, "Darwin"),
    g("Repuestos", "2026-09-19", 38, "viaticos taison", 625, "Darwin"),
    g("Repuestos", "2026-09-19", 38, "Prestamo taison", 500, "Darwin"),
    g("Repuestos", "2026-09-22", 39, "pinchazo", 30, "Darwin"),
    g("Repuestos", "2026-09-22", 39, "pegamento", 35, "Darwin"),
    g("Repuestos", "2026-09-23", 39, "viaticos taison", 300, "Darwin"),
    g("Repuestos", "2026-09-26", 39, "bateria", 400, "Mama"),
    g("Repuestos", "2026-09-29", 39, "prestamo taison", 100, "Mama"),
  ]);

  const m = (
    tipo: "Adelanto" | "Prestamo",
    fecha: string,
    monto: number,
    descripcion: string,
  ) => conSemana({ pilotoId: taison.id, tipo, fecha, monto, descripcion });

  await db.insert(movimientosPiloto).values([
    m("Adelanto", "2026-09-17", 275, "viaticos"),
    m("Adelanto", "2026-09-19", 300, "viaticos"),
    m("Adelanto", "2026-09-21", 50, "viaticos"),
    m("Adelanto", "2026-09-23", 300, "viaticos"),
    m("Adelanto", "2026-09-26", 100, "viaticos"),
    m("Adelanto", "2026-09-29", 100, "viaticos"),
    m("Prestamo", "2026-09-19", 500, "Prestamo taison"),
    m("Prestamo", "2026-09-29", 100, "prestamo taison"),
  ]);

  console.log("Datos cargados.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
