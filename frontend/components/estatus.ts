import type { ESTATUS_VIAJE } from "@/lib/constantes";

type Estatus = (typeof ESTATUS_VIAJE)[number];

// Estilos visuales del estatus de un viaje (el ring lo pone quien lo usa).
export const ESTILO_ESTATUS: Record<Estatus, string> = {
  Programado: "bg-marca-50 text-marca-oscuro ring-marca/20",
  "En ruta": "bg-alerta-claro text-amber-800 ring-amber-300/60",
  Entregado: "bg-exito-claro text-green-800 ring-green-300/60",
  Cancelado: "bg-slate-100 text-slate-600 ring-slate-300 line-through",
};

export const PUNTO_ESTATUS: Record<Estatus, string> = {
  Programado: "bg-marca",
  "En ruta": "bg-amber-500 animate-pulse",
  Entregado: "bg-exito",
  Cancelado: "bg-slate-400",
};

// Borde izquierdo de las tarjetas móviles (usar junto con border-l-4).
export const BORDE_ESTATUS: Record<Estatus, string> = {
  Programado: "border-l-marca",
  "En ruta": "border-l-amber-500",
  Entregado: "border-l-exito",
  Cancelado: "border-l-slate-300 bg-slate-50",
};
