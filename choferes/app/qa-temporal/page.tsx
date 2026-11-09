// FIXTURE-QA: ruta temporal de pruebas visuales. BORRAR.
import { Actualizar } from "@/components/actualizar";
import { ProveedorAvisos } from "@/components/avisos";
import { Cabecera, Logo } from "@/components/marca";
import { TarjetaViaje, type Viaje } from "@/components/tarjeta-viaje";

const HOY = "2026-11-09";
const base = { planta: "Planta Escuintla", placa: "C-123BCD", producto: "Cemento gris 42.5kg" };
const V: Viaje[] = [
  { id: 1, pedido: "PED-104522", fecha: HOY, destino: "Quetzaltenango", estatus: "En ruta", ...base },
  { id: 2, pedido: "PED-104530", fecha: HOY, destino: "San Pedro Sacatepéquez, San Marcos", estatus: "Programado", ...base },
  { id: 3, pedido: "PED-104531", fecha: "2026-11-10", destino: "Cobán", estatus: "Programado", ...base },
  { id: 4, pedido: "PED-104500", fecha: "2026-11-07", destino: "Huehuetenango", estatus: "Programado", ...base },
];

export default function QA() {
  return (
    <ProveedorAvisos>
      <Cabecera>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo tamano={44} prioridad />
            <p className="truncate font-display text-lg font-bold tracking-tight">
              TransVelsa <span className="text-plata">Choferes</span>
            </p>
          </div>
          <Actualizar />
        </div>
        <h1 className="mt-6 font-display text-[2.125rem] leading-tight font-bold tracking-tight">Hola, Juan</h1>
      </Cabecera>
      <main className="mx-auto w-full max-w-xl space-y-4 px-4 pt-6 pb-24">
        <TarjetaViaje viaje={V[0]} token={"x".repeat(40)} hoy={HOY} otroEnRuta={false} />
        <TarjetaViaje viaje={V[1]} token={"x".repeat(40)} hoy={HOY} otroEnRuta />
        <TarjetaViaje viaje={V[2]} token={"x".repeat(40)} hoy={HOY} otroEnRuta={false} />
        <TarjetaViaje viaje={V[3]} token={"x".repeat(40)} hoy={HOY} otroEnRuta={false} />
      </main>
    </ProveedorAvisos>
  );
}
