"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { Icono } from "./iconos";

const MINIMO_ENTRE_RECARGAS = 15_000;
const CADA = 120_000;

/**
 * Botón "Actualizar" + recarga automática de los datos (sin recargar la página)
 * al volver a la app, al recuperar la señal y cada 2 minutos con la app abierta.
 */
export function Actualizar() {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const ultima = useRef(0);

  useEffect(() => {
    ultima.current = Date.now();
    const recargar = (forzar = false) => {
      if (document.visibilityState !== "visible") return;
      if (!forzar && Date.now() - ultima.current < MINIMO_ENTRE_RECARGAS) return;
      ultima.current = Date.now();
      startTransition(() => router.refresh());
    };
    const alVolver = () => recargar();
    const alConectar = () => recargar(true);
    const intervalo = setInterval(() => recargar(true), CADA);
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("pageshow", alVolver);
    window.addEventListener("online", alConectar);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("pageshow", alVolver);
      window.removeEventListener("online", alConectar);
    };
  }, [router]);

  return (
    <button
      type="button"
      onClick={() => {
        ultima.current = Date.now();
        startTransition(() => router.refresh());
      }}
      disabled={pendiente}
      className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-white/10 px-4 text-base font-semibold text-white ring-1 ring-white/20 transition-colors active:bg-white/20 disabled:opacity-80"
    >
      <Icono nombre="actualizar" className={`size-5 ${pendiente ? "animate-spin" : ""}`} />
      {pendiente ? "Actualizando…" : "Actualizar"}
    </button>
  );
}
