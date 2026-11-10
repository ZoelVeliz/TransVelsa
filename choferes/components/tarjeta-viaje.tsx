"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { completarViaje, iniciarRuta, type Resultado } from "@/app/c/[token]/acciones";
import type { EstatusViaje } from "@/lib/db";
import { etiquetaDia, formatoFecha } from "@/lib/fechas";
import { useAvisar } from "./avisos";
import { PillEstatus } from "./estatus";
import { Icono } from "./iconos";

export type Viaje = {
  id: number;
  pedido: string;
  fecha: string;
  destino: string;
  producto: string;
  planta: string;
  placa: string;
  estatus: EstatusViaje;
};

const SIN_CONEXION = "No se pudo conectar. Revisa tu señal e intenta de nuevo.";

export function TarjetaViaje({
  viaje,
  token,
  hoy,
  otroEnRuta,
}: {
  viaje: Viaje;
  token: string;
  hoy: string;
  /** El chofer ya tiene otro viaje En ruta (solo se avisa, no se bloquea). */
  otroEnRuta: boolean;
}) {
  const avisar = useAvisar();
  const [pendiente, startTransition] = useTransition();
  const [estatus, setEstatusOptimista] = useOptimistic(viaje.estatus);
  const [error, setError] = useState<string | null>(null);
  const hoja = useRef<HTMLDialogElement>(null);

  const enRuta = viaje.estatus === "En ruta";
  const etiqueta = etiquetaDia(viaje.fecha, hoy);
  const atrasado = viaje.estatus === "Programado" && viaje.fecha < hoy;

  function ejecutar(
    accion: (token: string, id: number) => Promise<Resultado>,
    siguiente: EstatusViaje,
    exito: string,
  ) {
    if (pendiente) return;
    setError(null);
    startTransition(async () => {
      setEstatusOptimista(siguiente);
      let r: Resultado;
      try {
        r = await accion(token, viaje.id);
      } catch {
        r = { ok: false, error: SIN_CONEXION };
      }
      if (r.ok) avisar(exito);
      else setError(r.error ?? SIN_CONEXION);
    });
  }

  const confirmarCompletar = () => {
    hoja.current?.close();
    ejecutar(completarViaje, "Entregado", "Viaje completado");
  };

  return (
    <article
      aria-labelledby={`destino-${viaje.id}`}
      className={`relative isolate overflow-hidden rounded-tarjeta bg-superficie shadow-tarjeta ${
        enRuta ? "ring-2 ring-amber-500/50" : "ring-1 ring-borde"
      }`}
    >
      {enRuta && (
        <>
          <div aria-hidden className="franja-marca h-1" />
          <div
            aria-hidden
            className="absolute -top-20 -right-20 -z-10 size-64 rounded-full bg-[radial-gradient(closest-side,rgb(245_158_11/0.18),transparent)]"
          />
        </>
      )}
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <PillEstatus estatus={estatus} />
          <p className="flex items-center gap-1.5 text-base font-semibold text-tenue">
            <Icono nombre="calendario" className="size-4.5" />
            {etiqueta && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-sm font-bold ${
                  etiqueta === "Hoy" ? "bg-tinta text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]" : "bg-white/80 text-tinta ring-1 ring-borde"
                }`}
              >
                {etiqueta}
              </span>
            )}
            <span className="cifra">{formatoFecha(viaje.fecha)}</span>
          </p>
        </div>

        <p className="mt-4 text-sm font-medium tracking-[0.1em] text-tenue uppercase">Destino</p>
        <h3
          id={`destino-${viaje.id}`}
          className="font-display text-[1.875rem] leading-[1.1] font-semibold tracking-tight break-words text-tinta"
        >
          {viaje.destino}
        </h3>
        <p className="mt-1.5 flex items-center gap-2 text-lg font-medium text-tinta">
          <Icono nombre="paquete" className="size-5 shrink-0 text-tenue" />
          {viaje.producto}
        </p>

        <dl className="mt-4 grid grid-cols-3 divide-x divide-borde rounded-2xl bg-white/70 shadow-[inset_0_1px_0_white] ring-1 ring-borde">
          <Dato titulo="Pedido" valor={viaje.pedido} />
          <Dato titulo="Planta" valor={viaje.planta} />
          <Dato titulo="Camión" valor={viaje.placa} />
        </dl>

        {viaje.estatus === "Programado" && (atrasado || otroEnRuta) && (
          <p className="mt-3 flex gap-2 rounded-2xl bg-marca-50/80 p-3 text-base leading-snug text-marca-oscuro ring-1 ring-marca/15">
            <Icono nombre="info" className="mt-0.5 size-5 shrink-0" />
            {otroEnRuta
              ? "Ya tienes un viaje en ruta. Si vas a iniciar este, recuerda completar el otro."
              : "Este viaje era para un día anterior y sigue pendiente."}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-3 flex gap-2 rounded-2xl bg-peligro-claro/80 p-3 text-base leading-snug font-medium text-peligro ring-1 ring-peligro/25"
          >
            <Icono nombre="alerta" className="mt-0.5 size-5 shrink-0" />
            {error}
          </p>
        )}

        {viaje.estatus === "Programado" && (
          <BotonGrande
            tono="marca"
            icono="iniciar"
            pendiente={pendiente}
            onClick={() => ejecutar(iniciarRuta, "En ruta", "Ruta iniciada. ¡Buen viaje!")}
          >
            Iniciar ruta
          </BotonGrande>
        )}
        {enRuta && (
          <BotonGrande
            tono="exito"
            icono="check"
            pendiente={pendiente}
            onClick={() => {
              setError(null);
              hoja.current?.showModal();
            }}
          >
            Completar viaje
          </BotonGrande>
        )}
      </div>

      {enRuta && (
        <dialog
          ref={hoja}
          aria-labelledby={`confirmar-${viaje.id}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) e.currentTarget.close();
          }}
          className="m-0 mt-auto max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-[2rem] bg-white/95 p-0 text-tinta shadow-hoja ring-1 ring-white backdrop-blur-xl open:animate-subir"
        >
          <div className="mx-auto w-full max-w-xl px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <div aria-hidden className="mx-auto h-1.5 w-12 rounded-full bg-borde-fuerte" />
            <h2 id={`confirmar-${viaje.id}`} className="mt-4 font-display text-[1.625rem] leading-tight font-semibold">
              ¿Completar este viaje?
            </h2>
            <p className="mt-1 text-base text-tenue">Confírmalo solo cuando ya entregaste la carga.</p>

            <div className="mt-4 rounded-2xl bg-linear-to-b from-fondo to-white p-4 shadow-[inset_0_1px_0_white] ring-1 ring-borde">
              <p className="text-sm font-medium tracking-[0.1em] text-tenue uppercase">Destino</p>
              <p className="font-display text-[1.75rem] leading-tight font-semibold break-words">{viaje.destino}</p>
              <p className="mt-1 text-lg">
                Pedido <span className="cifra font-bold">{viaje.pedido}</span>
                <span className="text-tenue"> · {viaje.producto}</span>
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                autoFocus
                onClick={confirmarCompletar}
                className="inline-flex min-h-15 items-center justify-center gap-2 rounded-control bg-exito bg-linear-to-b from-white/20 to-transparent px-5 text-xl font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_10px_24px_-8px_rgb(15_122_61/0.7)] active:bg-exito-oscuro"
              >
                <Icono nombre="check" className="size-6" strokeWidth={2.6} />
                Sí, ya entregué
              </button>
              <button
                type="button"
                onClick={() => hoja.current?.close()}
                className="min-h-14 rounded-control bg-white px-5 text-lg font-semibold text-tinta shadow-[0_1px_2px_rgb(17_24_39/0.06)] ring-1 ring-borde-fuerte active:bg-fondo"
              >
                Cancelar
              </button>
            </div>
          </div>
        </dialog>
      )}
    </article>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="min-w-0 px-3 py-2.5">
      <dt className="text-sm font-medium text-tenue">{titulo}</dt>
      <dd className="cifra truncate text-[1.0625rem] font-bold text-tinta" title={valor}>
        {valor}
      </dd>
    </div>
  );
}

function BotonGrande({
  tono,
  icono,
  pendiente,
  onClick,
  children,
}: {
  tono: "marca" | "exito";
  icono: "iniciar" | "check";
  pendiente: boolean;
  onClick: () => void;
  children: string;
}) {
  const color =
    tono === "marca"
      ? "bg-marca active:bg-marca-oscuro shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_12px_28px_-10px_rgb(36_80_230/0.8)]"
      : "bg-exito active:bg-exito-oscuro shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_12px_28px_-10px_rgb(15_122_61/0.75)]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pendiente}
      aria-busy={pendiente}
      className={`mt-5 inline-flex min-h-15 w-full items-center justify-center gap-2.5 rounded-control bg-linear-to-b from-white/20 to-transparent px-5 text-xl font-bold text-white transition-[transform,background-color] active:scale-[0.99] disabled:opacity-75 ${color}`}
    >
      {pendiente ? (
        <>
          <Icono nombre="cargando" className="size-6 animate-girar" strokeWidth={2.6} />
          Guardando…
        </>
      ) : (
        <>
          <Icono nombre={icono} className="size-6" relleno={icono === "iniciar"} strokeWidth={2.6} />
          {children}
        </>
      )}
    </button>
  );
}
