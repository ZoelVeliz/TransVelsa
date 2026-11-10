import { and, asc, eq, gte, inArray, or } from "drizzle-orm";
import type { Metadata } from "next";
import { io } from "next/cache";
import { Suspense, type ReactNode } from "react";
import { Actualizar } from "@/components/actualizar";
import { ProveedorAvisos } from "@/components/avisos";
import { PillEstatus } from "@/components/estatus";
import { Icono } from "@/components/iconos";
import { Cabecera, Logo, PantallaAviso } from "@/components/marca";
import { TarjetaViaje, type Viaje } from "@/components/tarjeta-viaje";
import { pilotoPorToken, tokenConFormato } from "@/lib/choferes";
import { camiones, db, viajes } from "@/lib/db";
import { etiquetaDia, fechaLarga, formatoFecha, hoyISO, sumarDias } from "@/lib/fechas";

// El manifest va por chofer: su start_url lleva el token. En iPhone la app de
// pantalla de inicio no comparte cookies con Safari, así que el enlace mismo
// es la "sesión". Solo se lee la URL, sin tocar la base.
export async function generateMetadata({ params }: PageProps<"/c/[token]">): Promise<Metadata> {
  const { token } = await params;
  if (!tokenConFormato(token)) return { title: "Enlace no válido · TransVelsa" };
  return {
    title: "Mis viajes · TransVelsa",
    manifest: `/c/${token}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: "TransVelsa", statusBarStyle: "black-translucent" },
  };
}

export default function PaginaChofer({ params }: PageProps<"/c/[token]">) {
  return (
    <Suspense fallback={<Esqueleto />}>
      <Inicio params={params} />
    </Suspense>
  );
}

const DIAS_ENTREGADOS = 7;
const MAX_ENTREGADOS = 10;

async function Inicio({ params }: { params: PageProps<"/c/[token]">["params"] }) {
  const { token } = await params;
  const piloto = await pilotoPorToken(token);
  if (!piloto) return <EnlaceInvalido />;

  // "Hoy" se calcula por visita, nunca en el prerender (Cache Components).
  await io();
  const hoy = hoyISO();

  // Solo las columnas que se muestran.
  const filas: Viaje[] = await db
    .select({
      id: viajes.id,
      pedido: viajes.pedido,
      fecha: viajes.fecha,
      destino: viajes.destino,
      producto: viajes.producto,
      planta: viajes.planta,
      placa: camiones.placa,
      estatus: viajes.estatus,
    })
    .from(viajes)
    .innerJoin(camiones, eq(camiones.id, viajes.camionId))
    .where(
      and(
        eq(viajes.pilotoId, piloto.id),
        or(
          inArray(viajes.estatus, ["Programado", "En ruta"]),
          and(eq(viajes.estatus, "Entregado"), gte(viajes.fecha, sumarDias(hoy, -DIAS_ENTREGADOS))),
        ),
      ),
    )
    .orderBy(asc(viajes.fecha), asc(viajes.id));

  const enRuta = filas.filter((v) => v.estatus === "En ruta");
  const proximos = filas.filter((v) => v.estatus === "Programado");
  const entregados = filas
    .filter((v) => v.estatus === "Entregado")
    .reverse()
    .slice(0, MAX_ENTREGADOS);
  const nombre = piloto.nombre.trim().split(/\s+/)[0] ?? piloto.nombre;

  return (
    <ProveedorAvisos>
      <Cabecera>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo tamano={44} prioridad />
            <p className="truncate font-display text-lg font-semibold tracking-tight">
              TransVelsa <span className="text-plata">Choferes</span>
            </p>
          </div>
          <Actualizar />
        </div>
        <h1 className="mt-7 bg-linear-to-b from-white to-white/70 bg-clip-text font-display text-[2.375rem] leading-[1.05] font-semibold tracking-[-0.03em] text-transparent">
          Hola, {nombre}
        </h1>
        <p className="mt-0.5 text-lg text-plata-claro first-letter:uppercase">{fechaLarga(hoy)}</p>
        <p className="mt-3 flex flex-wrap gap-2 text-base font-semibold">
          <Resumen n={enRuta.length} uno="en ruta" varios="en ruta" />
          <Resumen n={proximos.length} uno="próximo" varios="próximos" />
        </p>
      </Cabecera>

      <main className="mx-auto w-full max-w-xl space-y-8 px-[max(1rem,env(safe-area-inset-left))] pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {enRuta.length > 0 && (
          <Seccion titulo="Viaje en ruta" icono="camion" n={enRuta.length}>
            {enRuta.map((v) => (
              <TarjetaViaje key={v.id} viaje={v} token={token} hoy={hoy} otroEnRuta={false} />
            ))}
          </Seccion>
        )}

        {proximos.length > 0 && (
          <Seccion titulo="Próximos viajes" icono="calendario" n={proximos.length}>
            {proximos.map((v) => (
              <TarjetaViaje key={v.id} viaje={v} token={token} hoy={hoy} otroEnRuta={enRuta.length > 0} />
            ))}
          </Seccion>
        )}

        {enRuta.length === 0 && proximos.length === 0 && (
          <section className="relative isolate overflow-hidden rounded-tarjeta bg-superficie px-6 py-10 text-center shadow-tarjeta ring-1 ring-borde animate-entrada">
            <div aria-hidden className="absolute -top-24 left-1/2 -z-10 size-72 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(36_80_230/0.14),transparent)]" />
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-linear-to-b from-white to-marca-50 text-marca shadow-elevada ring-1 ring-marca/15">
              <Icono nombre="camion" className="size-8" />
            </span>
            <h2 className="mt-4 font-display text-[1.625rem] leading-tight font-semibold">
              No tienes viajes asignados
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-base leading-relaxed text-tenue">
              Cuando la oficina te programe un viaje aparecerá aquí. Toca “Actualizar” para revisar.
            </p>
          </section>
        )}

        {entregados.length > 0 && (
          <Seccion titulo="Entregados recientemente" icono="checkCirculo" n={entregados.length}>
            <ul className="divide-y divide-borde overflow-hidden rounded-tarjeta bg-superficie shadow-tarjeta ring-1 ring-borde">
              {entregados.map((v) => (
                <FilaEntregado key={v.id} viaje={v} hoy={hoy} />
              ))}
            </ul>
            <p className="px-1 text-base text-tenue">Últimos {DIAS_ENTREGADOS} días. Solo para consulta.</p>
          </Seccion>
        )}
      </main>
    </ProveedorAvisos>
  );
}

function Resumen({ n, uno, varios }: { n: number; uno: string; varios: string }) {
  return (
    <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] ring-1 ring-white/10 backdrop-blur-md">
      <span className="cifra text-lg font-bold text-white">{n}</span>
      <span className="text-plata-claro">{n === 1 ? uno : varios}</span>
    </span>
  );
}

function Seccion({
  titulo,
  icono,
  n,
  children,
}: {
  titulo: string;
  icono: "camion" | "calendario" | "checkCirculo";
  n: number;
  children: ReactNode;
}) {
  return (
    <section aria-label={titulo} className="space-y-3 animate-entrada">
      <h2 className="flex items-center gap-2.5 px-1 font-display text-[1.375rem] font-semibold tracking-tight">
        <span className="grid size-9 place-items-center rounded-xl bg-white/80 text-marca shadow-tarjeta ring-1 ring-borde">
          <Icono nombre={icono} className="size-5" />
        </span>
        {titulo}
        <span className="cifra ml-auto rounded-full bg-white/80 px-2.5 py-0.5 font-sans text-base font-semibold text-tinta shadow-tarjeta ring-1 ring-borde">
          {n}
        </span>
      </h2>
      {children}
    </section>
  );
}

function FilaEntregado({ viaje, hoy }: { viaje: Viaje; hoy: string }) {
  const etiqueta = etiquetaDia(viaje.fecha, hoy);
  return (
    <li className="flex items-start gap-3 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="font-display text-xl leading-tight font-semibold break-words">{viaje.destino}</p>
        <p className="mt-0.5 text-base text-tenue">
          {viaje.producto} · Pedido <span className="cifra font-semibold text-tinta">{viaje.pedido}</span>
        </p>
        <p className="cifra text-base text-tenue">
          {etiqueta ? `${etiqueta}, ` : ""}
          {formatoFecha(viaje.fecha)} · {viaje.placa}
        </p>
      </div>
      <PillEstatus estatus={viaje.estatus} />
    </li>
  );
}

function EnlaceInvalido() {
  return (
    <PantallaAviso icono="alerta" titulo="Enlace no válido o desactivado">
      <p>Pide uno nuevo a la oficina. Te lo enviarán por WhatsApp.</p>
      <p>Si guardaste la app en tu pantalla de inicio, bórrala y vuelve a agregarla con el enlace nuevo.</p>
    </PantallaAviso>
  );
}

function Esqueleto() {
  return (
    <div aria-busy="true" aria-label="Cargando tus viajes">
      <Cabecera>
        <div className="flex items-center gap-2.5">
          <Logo tamano={44} prioridad />
          <p className="font-display text-lg font-semibold tracking-tight">
            TransVelsa <span className="text-plata">Choferes</span>
          </p>
        </div>
        <div className="mt-6 h-10 w-52 rounded-lg bg-white/10" />
        <div className="mt-2 h-6 w-40 rounded-lg bg-white/10" />
        <div className="mt-3 h-9 w-56 rounded-full bg-white/10" />
      </Cabecera>
      <div className="mx-auto w-full max-w-xl space-y-4 px-4 pt-6">
        <div className="esqueleto h-7 w-44 rounded-lg" />
        {[0, 1].map((i) => (
          <div key={i} className="space-y-3 rounded-tarjeta bg-superficie p-4 shadow-tarjeta ring-1 ring-borde">
            <div className="esqueleto h-8 w-32 rounded-full" />
            <div className="esqueleto h-9 w-3/4 rounded-lg" />
            <div className="esqueleto h-16 rounded-xl" />
            <div className="esqueleto h-15 rounded-control" />
          </div>
        ))}
      </div>
    </div>
  );
}
