import type { Metadata } from "next";
import { asc, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  cambiarActivoUsuario,
  cambiarAdminUsuario,
  cambiarMiPassword,
  crearUsuario,
  restablecerPasswordUsuario,
} from "@/lib/acciones-usuarios";
import { MIN_PASSWORD } from "@/lib/contrasenas";
import { db, usuarios } from "@/lib/db";
import { usuarioActual } from "@/lib/sesion";
import { AccionesUsuario, FormularioMiPassword, FormularioNuevoUsuario } from "@/components/usuarios";
import {
  Avatar,
  Campo,
  Cargando,
  claseContenedorTabla,
  claseFila,
  claseInput,
  claseTabla,
  claseTarjetaMovil,
  claseThead,
  Encabezado,
  Insignia,
  Nota,
  PanelAlta,
  Pastilla,
  Tarjeta,
} from "@/components/ui";

export const metadata: Metadata = { title: "Usuarios · TransVelsa" };

const fechaHora = (d: Date | null) =>
  d
    ? d.toLocaleString("es-GT", {
        timeZone: "America/Guatemala",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Nunca";

export default function Page() {
  return (
    <div className="space-y-6 animate-entrada">
      <Encabezado
        eyebrow="Acceso"
        icono="usuarios"
        titulo="Usuarios"
        descripcion="Cuentas para entrar al panel de oficina. Solo un administrador puede crearlas."
      />
      <Suspense fallback={<Cargando />}>
        <Contenido />
      </Suspense>
    </div>
  );
}

async function Contenido() {
  const yo = await usuarioActual();
  if (!yo) redirect("/login");

  const lista = yo.esAdmin
    ? await db
        .select({
          id: usuarios.id,
          usuario: usuarios.usuario,
          nombre: usuarios.nombre,
          esAdmin: usuarios.esAdmin,
          activo: usuarios.activo,
          ultimoAcceso: usuarios.ultimoAcceso,
          // Se calcula en la base: la hora "ahora" no se lee durante el render.
          bloqueado: sql<boolean>`coalesce(${usuarios.bloqueadoHasta} > (now() at time zone 'utc'), false)`,
        })
        .from(usuarios)
        .orderBy(asc(usuarios.nombre))
    : [];
  return (
    <>
      <Tarjeta titulo="Mi cuenta" icono="usuario" descripcion={`${yo.nombre} · @${yo.usuario}${yo.esAdmin ? " · Administrador" : ""}`}>
        <PanelAlta titulo="Cambiar mi contraseña" descripcion={`Mínimo ${MIN_PASSWORD} caracteres. Se cerrará tu sesión en otros dispositivos.`}>
          <FormularioMiPassword accion={cambiarMiPassword}>
            <Campo etiqueta="Contraseña actual">
              <input name="actual" type="password" required autoComplete="current-password" className={claseInput} />
            </Campo>
            <Campo etiqueta="Contraseña nueva">
              <input name="nueva" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className={claseInput} />
            </Campo>
            <Campo etiqueta="Repite la nueva">
              <input name="repetida" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className={claseInput} />
            </Campo>
          </FormularioMiPassword>
        </PanelAlta>
      </Tarjeta>

      {yo.esAdmin ? (
        <>
          <Tarjeta id="nueva-cuenta" titulo="Nueva cuenta" icono="mas" descripcion="Se genera una contraseña temporal que verás una sola vez">
            <FormularioNuevoUsuario accion={crearUsuario}>
              <Campo etiqueta="Nombre completo" ancho>
                <input name="nombre" required maxLength={80} placeholder="Ej. Ana López" className={`${claseInput} sm:w-56`} />
              </Campo>
              <Campo etiqueta="Usuario para entrar" ancho ayuda="Minúsculas, sin espacios">
                <input
                  name="usuario"
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[a-z0-9][a-z0-9._\-]{2,29}"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="ana.lopez"
                  className={`${claseInput} sm:w-44`}
                />
              </Campo>
              <label className="col-span-2 flex h-11 items-center gap-2.5 text-sm font-medium text-tinta sm:h-9">
                <input name="esAdmin" type="checkbox" className="size-4.5 rounded accent-marca" />
                Administrador
              </label>
            </FormularioNuevoUsuario>
          </Tarjeta>

          <Tarjeta titulo="Cuentas" icono="usuarios" extra={<Pastilla>{lista.length}</Pastilla>} flush>
            {/* Celular: tarjetas */}
            <ul className="space-y-3 p-4 md:hidden">
              {lista.map((u) => (
                <li key={u.id} className={claseTarjetaMovil}>
                  <FilaInfo u={u} yo={yo.id} />
                  <div className="mt-3 border-t border-borde pt-3">
                    <Acciones u={u} yo={yo.id} />
                  </div>
                </li>
              ))}
            </ul>
            {/* Escritorio: tabla */}
            <div className={`${claseContenedorTabla} max-md:hidden`}>
              <table className={claseTabla}>
                <thead className={claseThead}>
                  <tr>
                    <th>Persona</th>
                    <th>Estado</th>
                    <th>Último acceso</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((u) => (
                    <tr key={u.id} className={claseFila}>
                      <td>
                        <Persona u={u} yo={yo.id} />
                      </td>
                      <td>
                        <Estado u={u} />
                      </td>
                      <td className="whitespace-nowrap text-tenue tabular-nums">{fechaHora(u.ultimoAcceso)}</td>
                      <td>
                        <Acciones u={u} yo={yo.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Tarjeta>
        </>
      ) : (
        <Nota>Solo un administrador puede crear cuentas o cambiar las de otras personas.</Nota>
      )}
    </>
  );
}

type Fila = {
  id: number;
  usuario: string;
  nombre: string;
  esAdmin: boolean;
  activo: boolean;
  ultimoAcceso: Date | null;
  bloqueado: boolean;
};

function Persona({ u, yo }: { u: Fila; yo: number }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar nombre={u.nombre} />
      <div className="min-w-0">
        <p className={`truncate font-medium ${u.activo ? "text-tinta" : "text-suave line-through"}`}>
          {u.nombre}
          {u.id === yo && <span className="ml-1.5 text-xs font-normal text-suave no-underline">(tú)</span>}
        </p>
        <p className="truncate font-mono text-xs text-tenue">@{u.usuario}</p>
      </div>
    </div>
  );
}

function Estado({ u }: { u: Fila }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {u.activo ? (
        <Insignia tono="exito" punto>
          Activo
        </Insignia>
      ) : (
        <Insignia tono="neutro" punto>
          Desactivado
        </Insignia>
      )}
      {u.esAdmin && (
        <Insignia tono="marca" icono="usuarios">
          Admin
        </Insignia>
      )}
      {u.bloqueado && (
        <Insignia tono="alerta" icono="candado">
          Bloqueado
        </Insignia>
      )}
    </div>
  );
}

function FilaInfo({ u, yo }: { u: Fila; yo: number }) {
  return (
    <div className="space-y-2.5">
      <Persona u={u} yo={yo} />
      <Estado u={u} />
      <p className="text-xs text-tenue">
        Último acceso: <span className="tabular-nums">{fechaHora(u.ultimoAcceso)}</span>
      </p>
    </div>
  );
}

function Acciones({ u, yo }: { u: Fila; yo: number }) {
  return (
    <AccionesUsuario
      nombre={u.nombre}
      activo={u.activo}
      esAdmin={u.esAdmin}
      esYo={u.id === yo}
      alternarActivo={cambiarActivoUsuario.bind(null, u.id, !u.activo)}
      alternarAdmin={cambiarAdminUsuario.bind(null, u.id, !u.esAdmin)}
      restablecer={restablecerPasswordUsuario.bind(null, u.id)}
    />
  );
}
