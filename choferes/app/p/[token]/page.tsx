import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { io } from "next/cache";
import { Suspense } from "react";
import { Actualizar } from "@/components/actualizar";
import { ProveedorAvisos } from "@/components/avisos";
import { PillEstatus } from "@/components/estatus";
import { FormularioPedido } from "@/components/formulario-pedido";
import { Icono } from "@/components/iconos";
import { Cabecera, Logo, PantallaAviso } from "@/components/marca";
import { db, tarifas, viajes } from "@/lib/db";
import { etiquetaDia, formatoFecha, hoyISO } from "@/lib/fechas";
import { tokenPedidosValido } from "@/lib/pedidos";
import { crearPedido } from "./acciones";

export const metadata: Metadata = { title: "Pedidos · TransVelsa" };

export default function PaginaPedidos({ params }: PageProps<"/p/[token]">) {
  return (
    <Suspense fallback={<Esqueleto />}>
      <Inicio params={params} />
    </Suspense>
  );
}

const MAX_PENDIENTES = 30;

async function Inicio({ params }: { params: PageProps<"/p/[token]">["params"] }) {
  const { token } = await params;
  if (!tokenPedidosValido(token)) return <EnlaceInvalido />;

  // "Hoy" se calcula por visita, nunca en el prerender (Cache Components).
  await io();
  const hoy = hoyISO();

  // Solo destino y producto: los montos del tarifario no se muestran aquí.
  const [listaTarifas, pendientes] = await Promise.all([
    db
      .select({ id: tarifas.id, destino: tarifas.destino, producto: tarifas.producto })
      .from(tarifas)
      .orderBy(asc(tarifas.destino), asc(tarifas.producto)),
    db
      .select({
        id: viajes.id,
        pedido: viajes.pedido,
        fecha: viajes.fecha,
        destino: viajes.destino,
        producto: viajes.producto,
        planta: viajes.planta,
      })
      .from(viajes)
      .where(eq(viajes.estatus, "Por asignar"))
      .orderBy(asc(viajes.fecha), asc(viajes.id))
      .limit(MAX_PENDIENTES),
  ]);

  return (
    <ProveedorAvisos>
      <Cabecera>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo tamano={44} prioridad />
            <p className="truncate font-display text-lg font-semibold tracking-tight">
              TransVelsa <span className="text-plata">Pedidos</span>
            </p>
          </div>
          <Actualizar />
        </div>
        <h1 className="mt-7 bg-linear-to-b from-white to-white/70 bg-clip-text font-display text-[2.375rem] leading-[1.05] font-semibold tracking-[-0.03em] text-transparent">Nuevo viaje</h1>
        <p className="mt-1.5 text-lg text-slate-300">TransVelsa asigna el camión y el piloto.</p>
      </Cabecera>

      <main className="mx-auto w-full max-w-xl space-y-8 px-[max(1rem,env(safe-area-inset-left))] pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {listaTarifas.length === 0 ? (
          <section className="rounded-tarjeta bg-superficie px-6 py-10 text-center shadow-tarjeta ring-1 ring-borde">
            <h2 className="font-display text-[1.625rem] leading-tight font-semibold">Aún no hay destinos</h2>
            <p className="mx-auto mt-2 max-w-xs text-base text-tenue">
              TransVelsa todavía no ha cargado los destinos. Avísales para poder enviar pedidos.
            </p>
          </section>
        ) : (
          <FormularioPedido accion={crearPedido.bind(null, token)} tarifas={listaTarifas} hoy={hoy} />
        )}

        <section aria-label="Pendientes de asignar" className="space-y-3">
          <h2 className="flex items-center gap-2.5 px-1 font-display text-[1.375rem] font-semibold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-white/80 text-marca shadow-tarjeta ring-1 ring-borde">
              <Icono nombre="calendario" className="size-5" />
            </span>
            Pendientes de asignar
            <span className="cifra ml-auto rounded-full bg-white/80 px-2.5 py-0.5 font-sans text-base font-semibold text-tinta shadow-tarjeta ring-1 ring-borde">
              {pendientes.length}
            </span>
          </h2>
          {pendientes.length === 0 ? (
            <p className="px-1 text-base text-tenue">
              No hay pedidos esperando. Cuando TransVelsa asigna un viaje, sale de esta lista.
            </p>
          ) : (
            <ul className="divide-y divide-borde overflow-hidden rounded-tarjeta bg-superficie shadow-tarjeta ring-1 ring-borde">
              {pendientes.map((v) => {
                const etiqueta = etiquetaDia(v.fecha, hoy);
                return (
                  <li key={v.id} className="flex items-start gap-3 px-4 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-xl leading-tight font-semibold break-words">{v.destino}</p>
                      <p className="mt-0.5 text-base text-tenue">
                        {v.producto} · Pedido <span className="cifra font-semibold text-tinta">{v.pedido}</span>
                      </p>
                      <p className="cifra text-base text-tenue">
                        {etiqueta ? `${etiqueta}, ` : ""}
                        {formatoFecha(v.fecha)} · Planta {v.planta}
                      </p>
                    </div>
                    <PillEstatus estatus="Por asignar" />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </ProveedorAvisos>
  );
}

function EnlaceInvalido() {
  return (
    <PantallaAviso icono="alerta" titulo="Enlace no válido o desactivado">
      <p>Pide el enlace de pedidos actualizado a TransVelsa.</p>
    </PantallaAviso>
  );
}

function Esqueleto() {
  return (
    <div aria-busy="true" aria-label="Cargando">
      <Cabecera>
        <div className="flex items-center gap-2.5">
          <Logo tamano={44} prioridad />
          <p className="font-display text-lg font-semibold tracking-tight">
            TransVelsa <span className="text-plata">Pedidos</span>
          </p>
        </div>
        <div className="mt-6 h-10 w-52 rounded-lg bg-white/10" />
        <div className="mt-2 h-6 w-64 rounded-lg bg-white/10" />
      </Cabecera>
      <div className="mx-auto w-full max-w-xl space-y-4 px-4 pt-6">
        <div className="esqueleto h-96 rounded-tarjeta" />
      </div>
    </div>
  );
}
