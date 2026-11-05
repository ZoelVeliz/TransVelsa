export const ESTATUS_VIAJE = [
  "Programado",
  "En ruta",
  "Entregado",
  "Cancelado",
] as const;

export const CATEGORIAS_GASTO = ["Diesel", "Repuestos"] as const;

export const TIPOS_MOVIMIENTO = ["Adelanto", "Prestamo"] as const;

export const TIPOS_MOVIMIENTO_CAJA = ["Ingreso", "Egreso", "Transferencia"] as const;

// Quién pone el dinero de cada gasto (los colores de la leyenda del Excel).
export const RESPONSABLES = [
  { nombre: "Zoel", clase: "bg-red-400", texto: "text-tinta" },
  { nombre: "Darwin", clase: "bg-yellow-300", texto: "text-tinta" },
  { nombre: "Mama", clase: "bg-green-400", texto: "text-tinta" },
  { nombre: "Joelmir", clase: "bg-sky-300", texto: "text-tinta" },
  { nombre: "Caja chica", clase: "bg-blue-900", texto: "text-white" },
] as const;

export const ESTILO_ESTATUS: Record<(typeof ESTATUS_VIAJE)[number], string> = {
  Programado: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
  "En ruta": "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  Entregado: "bg-green-100 text-green-800 ring-1 ring-green-200",
  Cancelado: "bg-slate-200 text-slate-500 line-through ring-1 ring-slate-300",
};
