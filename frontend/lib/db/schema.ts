import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

const dinero = (name: string) =>
  numeric(name, { precision: 12, scale: 2, mode: "number" });

export const estatusViaje = pgEnum("estatus_viaje", [
  "Programado",
  "En ruta",
  "Entregado",
  "Cancelado",
]);

export const categoriaGasto = pgEnum("categoria_gasto", [
  "Diesel",
  "Repuestos",
]);

export const tipoMovimiento = pgEnum("tipo_movimiento", [
  "Adelanto",
  "Prestamo",
]);

export const pilotos = pgTable("pilotos", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull().unique(),
  pagoPorViaje: dinero("pago_por_viaje").notNull().default(150),
  viaticoPorViaje: dinero("viatico_por_viaje").notNull().default(75),
  base: dinero("base").notNull().default(1500),
  activo: boolean("activo").notNull().default(true),
});

export const camiones = pgTable("camiones", {
  id: serial("id").primaryKey(),
  placa: text("placa").notNull().unique(),
  activo: boolean("activo").notNull().default(true),
});

export const tarifas = pgTable(
  "tarifas",
  {
    id: serial("id").primaryKey(),
    destino: text("destino").notNull(),
    producto: text("producto").notNull(),
    monto: dinero("monto").notNull(),
  },
  (t) => [unique().on(t.destino, t.producto)],
);

export const viajes = pgTable("viajes", {
  id: serial("id").primaryKey(),
  pedido: text("pedido").notNull().unique(),
  fecha: date("fecha").notNull(),
  anio: integer("anio").notNull(),
  semana: integer("semana").notNull(),
  camionId: integer("camion_id")
    .notNull()
    .references(() => camiones.id),
  pilotoId: integer("piloto_id")
    .notNull()
    .references(() => pilotos.id),
  planta: text("planta").notNull().default("SM"),
  destino: text("destino").notNull(),
  producto: text("producto").notNull(),
  estatus: estatusViaje("estatus").notNull().default("Programado"),
  // Copia de la tarifa al momento de crear el viaje, para que cambios
  // posteriores en el tarifario no alteren viajes ya hechos.
  tarifaFlete: dinero("tarifa_flete").notNull(),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
});

export const gastos = pgTable("gastos", {
  id: serial("id").primaryKey(),
  categoria: categoriaGasto("categoria").notNull(),
  fecha: date("fecha").notNull(),
  anio: integer("anio").notNull(),
  semana: integer("semana").notNull(),
  descripcion: text("descripcion").notNull(),
  monto: dinero("monto").notNull(),
  pagadoPor: text("pagado_por").notNull(),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
});

export const movimientosPiloto = pgTable("movimientos_piloto", {
  id: serial("id").primaryKey(),
  pilotoId: integer("piloto_id")
    .notNull()
    .references(() => pilotos.id),
  tipo: tipoMovimiento("tipo").notNull(),
  fecha: date("fecha").notNull(),
  anio: integer("anio").notNull(),
  semana: integer("semana").notNull(),
  monto: dinero("monto").notNull(),
  descripcion: text("descripcion"),
  creadoEn: timestamp("creado_en").notNull().defaultNow(),
});
