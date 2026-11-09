"use client";

import { PantallaAviso } from "@/components/marca";

export default function ErrorChofer({ retry }: { error: Error; retry: () => void }) {
  return (
    <PantallaAviso
      icono="alerta"
      titulo="No se pudieron cargar tus viajes"
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
      <p>Puede ser la señal. Revisa tu conexión e intenta otra vez.</p>
      <p>Si sigue pasando, avisa a la oficina.</p>
    </PantallaAviso>
  );
}
