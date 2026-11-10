// Subconjunto MÍNIMO del esquema de la base de TransVelsa.
//
// La dueña del esquema y de las migraciones es la app de oficina
// (frontend/lib/db/schema.ts, `npm run db:push` desde frontend/).
// Este archivo solo describe las columnas que usa la app de choferes y
// debe mantenerse sincronizado a mano con aquel: mismos nombres de tabla,
// de columna y valores del enum. Nunca agregar drizzle-kit a este proyecto.
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
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
} from "drizzle-orm/pg-core";

export const estatusViaje = pgEnum("estatus_viaje", [
  "Por asignar",
  "Programado",
  "En ruta",
  "Entregado",
  "Cancelado",
]);

export type EstatusViaje = (typeof estatusViaje.enumValues)[number];

export const pilotos = pgTable("pilotos", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  activo: boolean("activo").notNull(),
  token: text("token"),
});

export const camiones = pgTable("camiones", {
  id: serial("id").primaryKey(),
  placa: text("placa").notNull(),
});

const dinero = (name: string) => numeric(name, { precision: 12, scale: 2, mode: "number" });

// Solo para la pantalla de pedidos: el viaje copia el flete y el pago del chofer.
export const tarifas = pgTable("tarifas", {
  id: serial("id").primaryKey(),
  destino: text("destino").notNull(),
  producto: text("producto").notNull(),
  monto: dinero("monto").notNull(),
  pagoChofer: dinero("pago_chofer").notNull(),
});

export const viajes = pgTable("viajes", {
  id: serial("id").primaryKey(),
  pedido: text("pedido").notNull(),
  fecha: date("fecha").notNull(),
  anio: integer("anio").notNull(),
  semana: integer("semana").notNull(),
  // Vacíos mientras el viaje está "Por asignar".
  camionId: integer("camion_id"),
  pilotoId: integer("piloto_id"),
  planta: text("planta").notNull(),
  destino: text("destino").notNull(),
  producto: text("producto").notNull(),
  estatus: estatusViaje("estatus").notNull(),
  tarifaFlete: dinero("tarifa_flete").notNull(),
  pagoChofer: dinero("pago_chofer").notNull(),
  enRutaEn: timestamp("en_ruta_en"),
  entregadoEn: timestamp("entregado_en"),
});

if (!process.env.DATABASE_URL) {
  throw new Error("Falta DATABASE_URL en choferes/.env");
}

export const db = drizzle(neon(process.env.DATABASE_URL));
