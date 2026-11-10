import type { EstatusViaje } from "@/lib/db";
import { Icono, type NombreIcono } from "./iconos";

const ESTILO: Record<EstatusViaje, { clase: string; icono: NombreIcono }> = {
  "Por asignar": { clase: "bg-alerta-claro/80 text-alerta ring-alerta/25", icono: "info" },
  Programado: { clase: "bg-marca-50/90 text-marca-oscuro ring-marca/20", icono: "calendario" },
  "En ruta": { clase: "bg-alerta-claro/80 text-alerta ring-alerta/25", icono: "camion" },
  Entregado: { clase: "bg-exito-claro/80 text-exito-oscuro ring-exito/25", icono: "checkCirculo" },
  Cancelado: { clase: "bg-peligro-claro/80 text-peligro ring-peligro/20", icono: "alerta" },
};

/** Estatus con texto e ícono (nunca solo color). */
export function PillEstatus({ estatus }: { estatus: EstatusViaje }) {
  const { clase, icono } = ESTILO[estatus];
  return (
    <span
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-[0.9375rem] font-semibold shadow-[inset_0_1px_0_rgb(255_255_255/0.7)] ring-1 ring-inset ${clase}`}
    >
      <Icono nombre={icono} className="size-4.5" />
      {estatus}
    </span>
  );
}
