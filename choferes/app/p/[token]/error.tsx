"use client";

import { PantallaAviso } from "@/components/marca";

export default function ErrorPedidos({ retry }: { error: Error; retry: () => void }) {
  return (
    <PantallaAviso
      icono="alerta"
      titulo="No se pudo cargar la pantalla de pedidos"
      acciones={
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex min-h-14 w-full items-center justify-center rounded-control bg-marca px-5 text-lg font-bold text-white active:bg-marca-oscuro"
        >
          Intentar de nuevo
        </button>
      }
    >
      <p>Revisa tu conexión e intenta otra vez. Si sigue pasando, avisa a TransVelsa.</p>
    </PantallaAviso>
  );
}
