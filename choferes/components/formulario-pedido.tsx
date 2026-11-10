"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import type { EstadoPedido } from "@/app/p/[token]/acciones";
import { useAvisar } from "./avisos";
import { Icono } from "./iconos";

const claseCampo =
  "min-h-14 w-full rounded-control border border-borde-fuerte bg-white px-4 text-lg text-tinta focus:border-marca focus:outline-none focus:ring-4 focus:ring-marca/15";

/** Alta de un viaje sin camión ni piloto. Solo se limpia si se guardó bien. */
export function FormularioPedido({
  accion,
  tarifas,
  hoy,
}: {
  accion: (estado: EstadoPedido, form: FormData) => Promise<EstadoPedido>;
  tarifas: { id: number; destino: string; producto: string }[];
  hoy: string;
}) {
  const [estado, enviar, pendiente] = useActionState(async (previo: EstadoPedido, form: FormData) => {
    try {
      return await accion(previo, form);
    } catch {
      return { error: "No se pudo guardar. Revisa tu conexión e intenta de nuevo." };
    }
  }, {});
  const ref = useRef<HTMLFormElement>(null);
  const avisar = useAvisar();

  useEffect(() => {
    if (!estado.ok) return;
    ref.current?.reset();
    avisar(`Pedido ${estado.pedido} enviado`);
  }, [estado, avisar]);

  return (
    <form
      ref={ref}
      aria-busy={pendiente}
      onSubmit={(e) => {
        e.preventDefault();
        if (pendiente) return;
        const datos = new FormData(e.currentTarget);
        startTransition(() => enviar(datos));
      }}
      className="space-y-4 rounded-tarjeta bg-superficie p-4 shadow-tarjeta ring-1 ring-borde"
    >
      <Campo etiqueta="Número de pedido">
        <input name="pedido" required maxLength={60} autoComplete="off" className={`${claseCampo} cifra`} />
      </Campo>
      <Campo etiqueta="Destino / producto">
        <select name="tarifaId" required defaultValue="" className={claseCampo}>
          <option value="" disabled>
            Elige el destino…
          </option>
          {tarifas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.destino} / {t.producto}
            </option>
          ))}
        </select>
      </Campo>
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <Campo etiqueta="Fecha del viaje">
          <input name="fecha" type="date" required defaultValue={hoy} className={`${claseCampo} cifra`} />
        </Campo>
        <Campo etiqueta="Planta">
          <input name="planta" required defaultValue="SM" maxLength={20} className={`${claseCampo} uppercase`} />
        </Campo>
      </div>

      {estado.error && !pendiente && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-control bg-peligro-claro px-4 py-3 text-base font-medium text-peligro ring-1 ring-peligro/25 ring-inset"
        >
          <Icono nombre="alerta" className="mt-0.5 size-5 shrink-0" />
          {estado.error}
        </p>
      )}

      <button
        disabled={pendiente}
        className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-control bg-marca px-5 text-lg font-bold text-white active:bg-marca-oscuro disabled:opacity-80"
      >
        <Icono nombre={pendiente ? "cargando" : "check"} className={`size-6 ${pendiente ? "animate-spin" : ""}`} />
        {pendiente ? "Enviando…" : "Enviar pedido"}
      </button>
    </form>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="block text-base font-semibold text-tenue">{etiqueta}</span>
      {children}
    </label>
  );
}
