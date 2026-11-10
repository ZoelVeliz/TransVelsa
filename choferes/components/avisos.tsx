"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Icono } from "./iconos";

const Contexto = createContext<(texto: string) => void>(() => {});

/** Aviso flotante breve ("Viaje completado") que sobrevive a que la tarjeta cambie de sección. */
export function useAvisar() {
  return useContext(Contexto);
}

export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<{ texto: string; n: number } | null>(null);
  const reloj = useRef<ReturnType<typeof setTimeout>>(undefined);

  const avisar = useCallback((texto: string) => {
    setAviso((a) => ({ texto, n: (a?.n ?? 0) + 1 }));
  }, []);

  useEffect(() => {
    if (!aviso) return;
    clearTimeout(reloj.current);
    reloj.current = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(reloj.current);
  }, [aviso]);

  return (
    <Contexto value={avisar}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        {aviso && (
          <p
            key={aviso.n}
            className="vidrio-oscuro flex items-center gap-2.5 rounded-full px-5 py-3.5 text-base font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_20px_40px_-12px_rgb(0_0_0/0.5)] ring-1 ring-white/10 animate-entrada"
          >
            <Icono nombre="checkCirculo" className="size-6 text-green-400" />
            {aviso.texto}
          </p>
        )}
      </div>
    </Contexto>
  );
}
