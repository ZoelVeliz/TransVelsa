"use client";

import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { Icono } from "@/components/iconos";
import { iniciarSesion, type EstadoLogin } from "./acciones";

const claseCampoLogin =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 text-base text-white shadow-[inset_0_1px_2px_rgb(0_0_0/0.3)] transition-[border-color,box-shadow,background-color] placeholder:text-slate-500 focus:border-blue-400/60 focus:bg-white/[0.09] focus:outline-none focus:ring-4 focus:ring-blue-500/20 aria-invalid:border-red-400/60";

export function FormularioLogin() {
  const volver = useSearchParams().get("volver") ?? "";
  const [estado, enviar, pendiente] = useActionState<EstadoLogin, FormData>(iniciarSesion, {});
  const [ver, setVer] = useState(false);
  const [mayusculas, setMayusculas] = useState(false);
  const revisarMayusculas = (e: React.KeyboardEvent<HTMLInputElement>) =>
    setMayusculas(e.getModifierState?.("CapsLock") ?? false);

  return (
    <form action={enviar} className="space-y-4">
      <input type="hidden" name="volver" value={volver} />
      <label className="block space-y-1.5">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-slate-300">
          <Icono nombre="usuario" className="size-3.5 text-slate-500" />
          Usuario
        </span>
        {/* key: React limpia el formulario tras enviarlo; así el usuario escrito se conserva. */}
        <input
          key={estado.usuario ?? ""}
          name="usuario"
          defaultValue={estado.usuario}
          required
          autoFocus={!estado.usuario}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={30}
          className={claseCampoLogin}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-slate-300">
          <Icono nombre="candado" className="size-3.5 text-slate-500" />
          Contraseña
        </span>
        <span className="relative block">
          <input
            name="password"
            type={ver ? "text" : "password"}
            required
            autoFocus={Boolean(estado.usuario)}
            autoComplete="current-password"
            aria-invalid={estado.error ? true : undefined}
            aria-describedby={[estado.error && "error-login", mayusculas && "aviso-mayusculas"].filter(Boolean).join(" ") || undefined}
            onKeyDown={revisarMayusculas}
            onKeyUp={revisarMayusculas}
            onBlur={() => setMayusculas(false)}
            className={`${claseCampoLogin} pr-12`}
          />
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={ver}
            className="absolute inset-y-0 right-1 my-auto grid size-10 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <Icono nombre={ver ? "ojoTachado" : "ojo"} className="size-4.5" />
          </button>
        </span>
        {mayusculas && (
          <span id="aviso-mayusculas" className="flex items-center gap-1.5 text-xs font-medium text-amber-300 animate-aparecer">
            <Icono nombre="alerta" className="size-3.5" />
            Bloq Mayús está activado
          </span>
        )}
      </label>

      {estado.error && !pendiente && (
        <p
          id="error-login"
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200 ring-1 ring-red-400/25"
        >
          <Icono nombre="alerta" className="mt-0.5 size-4 shrink-0" />
          {estado.error}
        </p>
      )}

      <button
        disabled={pendiente}
        className="group mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-marca bg-linear-to-b from-white/20 to-transparent text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_10px_30px_-10px_rgb(36_80_230/0.9)] transition-[background-color,transform] hover:bg-marca-oscuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cabina active:scale-[0.99] disabled:opacity-70"
      >
        {pendiente && (
          <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {pendiente ? "Entrando…" : "Entrar"}
        {!pendiente && (
          <Icono nombre="chevronDer" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        )}
      </button>
    </form>
  );
}
