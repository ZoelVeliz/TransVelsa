import type { movimientosPiloto, pilotos } from "./db/schema";

type Piloto = typeof pilotos.$inferSelect;
type Movimiento = typeof movimientosPiloto.$inferSelect;

// Misma cuenta que la hoja "Taison" del Excel: pago de cada viaje (según su
// destino en el tarifario) + viáticos + base, menos adelantos y préstamos.
export function calcularLiquidacion(
  piloto: Piloto,
  { cantidadViajes, pagoViajes }: { cantidadViajes: number; pagoViajes: number },
  movimientos: Movimiento[],
) {
  const viaticos = cantidadViajes * piloto.viaticoPorViaje;
  const total = pagoViajes + viaticos + piloto.base;
  const sumar = (tipo: Movimiento["tipo"]) =>
    movimientos.filter((m) => m.tipo === tipo).reduce((s, m) => s + m.monto, 0);
  const adelantos = sumar("Adelanto");
  const prestamos = sumar("Prestamo");
  return {
    cantidadViajes,
    pagoViajes,
    viaticos,
    base: piloto.base,
    total,
    adelantos,
    prestamos,
    liquido: total - adelantos - prestamos,
  };
}

export type Liquidacion = ReturnType<typeof calcularLiquidacion>;
