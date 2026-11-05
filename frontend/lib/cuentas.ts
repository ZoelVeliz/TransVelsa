import { sql, type SQL } from "drizzle-orm";
import { RESPONSABLES } from "./constantes";
import { db } from "./db";

export const CUENTAS = RESPONSABLES.map((r) => r.nombre);
export const TIPOS_ASIENTO = ["Ingreso", "Egreso", "Transferencia", "Gasto"] as const;

export type Asiento = {
  clave: string;
  /** id en movimientos_caja; null si el asiento viene de un gasto. */
  movimientoId: number | null;
  fecha: string;
  cuenta: string;
  tipo: (typeof TIPOS_ASIENTO)[number];
  /** Positivo si entra dinero a la cuenta, negativo si sale. */
  monto: number;
  descripcion: string;
  /** En transferencias, la otra cuenta. */
  otra: string | null;
  /** Saldo de la cuenta justo después de este asiento. */
  saldo: number;
};

export type FiltroAsientos = {
  cuenta?: string;
  tipo?: (typeof TIPOS_ASIENTO)[number];
  fechaDesde?: string;
  fechaHasta?: string;
};

// Libro de cada cuenta: sus movimientos (una transferencia sale de una cuenta
// y entra a otra, así que da dos asientos) más los gastos que pagó.
const ASIENTOS = sql`
  with asientos as (
    select 'm' || id as clave, id as movimiento_id, fecha, cuenta, tipo::text as tipo,
      (case when tipo = 'Ingreso' then monto else -monto end)::float8 as monto,
      descripcion, cuenta_destino as otra, creado_en
    from movimientos_caja
    union all
    select 'd' || id, id, fecha, cuenta_destino, 'Transferencia', monto::float8,
      descripcion, cuenta, creado_en
    from movimientos_caja
    where tipo = 'Transferencia'
    union all
    select 'g' || id, null, fecha, pagado_por, 'Gasto', -monto::float8,
      categoria::text || ': ' || descripcion, null, creado_en
    from gastos
  ),
  libro as (
    select *, sum(monto) over (
      partition by cuenta order by fecha, creado_en, clave
      rows between unbounded preceding and current row
    ) as saldo
    from asientos
  )
`;

function donde(f: FiltroAsientos): SQL {
  const partes: SQL[] = [sql`cuenta in (${sql.join(CUENTAS.map((c) => sql`${c}`), sql`, `)})`];
  if (f.cuenta) partes.push(sql`cuenta = ${f.cuenta}`);
  if (f.tipo) partes.push(sql`tipo = ${f.tipo}`);
  if (f.fechaDesde) partes.push(sql`fecha >= ${f.fechaDesde}`);
  if (f.fechaHasta) partes.push(sql`fecha <= ${f.fechaHasta}`);
  return sql.join(partes, sql` and `);
}

/** Saldo actual de cada cuenta, con todo lo que ha entrado y salido. */
export async function obtenerSaldos() {
  const { rows } = await db.execute<{ cuenta: string; entradas: number; salidas: number }>(sql`
    ${ASIENTOS}
    select cuenta,
      coalesce(sum(monto) filter (where monto > 0), 0)::float8 as entradas,
      coalesce(-sum(monto) filter (where monto < 0), 0)::float8 as salidas
    from libro
    group by cuenta
  `);
  return CUENTAS.map((cuenta) => {
    const r = rows.find((x) => x.cuenta === cuenta);
    const entradas = Number(r?.entradas ?? 0);
    const salidas = Number(r?.salidas ?? 0);
    return { cuenta, entradas, salidas, saldo: entradas - salidas };
  });
}

/** Totales de lo filtrado (para la paginación y el pie de la tabla). */
export async function totalesAsientos(f: FiltroAsientos) {
  const { rows } = await db.execute<{ n: number; entradas: number; salidas: number }>(sql`
    ${ASIENTOS}
    select count(*)::int as n,
      coalesce(sum(monto) filter (where monto > 0), 0)::float8 as entradas,
      coalesce(-sum(monto) filter (where monto < 0), 0)::float8 as salidas
    from libro
    where ${donde(f)}
  `);
  const r = rows[0];
  return { n: Number(r?.n ?? 0), entradas: Number(r?.entradas ?? 0), salidas: Number(r?.salidas ?? 0) };
}

/** Una página del libro, lo más reciente primero. */
export async function listarAsientos(f: FiltroAsientos, limite: number, desde: number) {
  const { rows } = await db.execute<Record<string, unknown>>(sql`
    ${ASIENTOS}
    select clave, movimiento_id, to_char(fecha, 'YYYY-MM-DD') as fecha, cuenta, tipo,
      monto, descripcion, otra, saldo::float8 as saldo
    from libro
    where ${donde(f)}
    order by fecha desc, creado_en desc, clave desc
    limit ${limite} offset ${desde}
  `);
  return rows.map(
    (r): Asiento => ({
      clave: String(r.clave),
      movimientoId: r.movimiento_id == null ? null : Number(r.movimiento_id),
      fecha: String(r.fecha),
      cuenta: String(r.cuenta),
      tipo: r.tipo as Asiento["tipo"],
      monto: Number(r.monto),
      descripcion: String(r.descripcion),
      otra: r.otra == null ? null : String(r.otra),
      saldo: Number(r.saldo),
    }),
  );
}
