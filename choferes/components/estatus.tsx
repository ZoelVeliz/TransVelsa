import type { EstatusViaje } from "@/lib/db";
import { Icono, type NombreIcono } from "./iconos";

const ESTILO: Record<EstatusViaje, { clase: string; icono: NombreIcono }> = {
  Programado: { clase: "bg-marca-50 text-marca-oscuro ring-marca/25", icono: "calendario" },
  "En ruta": { clase: "bg-alerta-claro text-alerta ring-alerta/30", icono: "camion" },
  Entregado: { clase: "bg-exito-claro text-exito-oscuro ring-exito/30", icono: "checkCirculo" },
  Cancelado: { clase: "bg-peligro-claro text-peligro ring-peligro/25", icono: "alerta" },
};

/** Estatus con texto e ícono (nunca solo color). */
export function PillEstatus({ estatus }: { estatus: EstatusViaje }) {
  const { clase, icono } = ESTILO[estatus];
  return (
    <span
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-[0.9375rem] font-bold ring-1 ring-inset ${clase}`}
    >
      <Icono nombre={icono} className="size-4.5" />
      {estatus}
    </span>
  );
}
