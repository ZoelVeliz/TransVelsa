import Link from "next/link";
import { TAMANOS_PAGINA, urlCon, type Params } from "@/lib/filtros";
import { Icono } from "./iconos";

// 1 … 4 5 6 … 10: siempre primera, última y vecinas de la actual.
function numeros(actual: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const centro = [actual - 1, actual, actual + 1].filter((n) => n > 1 && n < total);
  const lista: (number | "…")[] = [1];
  if (centro[0] > 2) lista.push("…");
  lista.push(...centro);
  if (centro[centro.length - 1] < total - 1) lista.push("…");
  lista.push(total);
  return lista;
}

const claseCelda =
  "grid h-9 min-w-9 place-items-center rounded-lg px-2 text-sm font-medium tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca max-sm:h-10 max-sm:min-w-10";

export function Paginacion({
  ruta,
  sp,
  total,
  pagina,
  porPagina,
  clave = "pagina",
  reiniciar = [clave],
}: {
  ruta: string;
  sp: Params;
  total: number;
  pagina: number;
  porPagina: number;
  /** Parámetro de URL con el número de página de esta tabla. */
  clave?: string;
  /** Parámetros de página que se reinician al cambiar el tamaño. */
  reiniciar?: string[];
}) {
  if (total <= TAMANOS_PAGINA[0]) return null;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(total, pagina * porPagina);
  const ir = (n: number) => urlCon(ruta, sp, { [clave]: n === 1 ? undefined : n });

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col gap-3 border-t border-borde bg-fondo/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-tenue">
        <p className="tabular-nums">
          <span className="font-semibold text-tinta">{desde}–{hasta}</span> de{" "}
          <span className="font-semibold text-tinta">{total}</span>
        </p>
        <div className="flex items-center gap-2">
          <span id={`tam-${clave}`}>Por página</span>
          <div
            role="group"
            aria-labelledby={`tam-${clave}`}
            className="inline-flex rounded-lg bg-fondo-2 p-0.5 ring-1 ring-borde ring-inset"
          >
            {TAMANOS_PAGINA.map((t) => (
              <Link
                key={t}
                href={urlCon(
                  ruta,
                  sp,
                  Object.fromEntries([
                    ["porPagina", t === 20 ? undefined : t],
                    ...reiniciar.map((k) => [k, undefined]),
                  ]),
                )}
                scroll={false}
                aria-current={t === porPagina ? "true" : undefined}
                className="grid h-8 min-w-9 place-items-center rounded-md px-2 text-sm font-medium tabular-nums text-tenue transition hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca aria-[current=true]:bg-white aria-[current=true]:text-tinta aria-[current=true]:shadow-tarjeta max-sm:h-10 max-sm:min-w-11"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {totalPaginas > 1 && (
        <ul className="flex items-center gap-1 max-sm:justify-between">
          <li>
            {pagina > 1 ? (
              <Link href={ir(pagina - 1)} scroll={false} aria-label="Página anterior" className={`${claseCelda} bg-white text-tinta shadow-control ring-1 ring-inset ring-borde-fuerte hover:bg-marca-50 hover:text-marca`}>
                <Icono nombre="chevronIzq" className="size-4" />
              </Link>
            ) : (
              <span aria-hidden className={`${claseCelda} text-suave ring-1 ring-inset ring-borde`}>
                <Icono nombre="chevronIzq" className="size-4" />
              </span>
            )}
          </li>
          {numeros(pagina, totalPaginas).map((n, i) => (
            <li key={`${n}-${i}`} className={n === "…" ? "" : "max-sm:hidden"}>
              {n === "…" ? (
                <span aria-hidden className="grid h-9 w-6 place-items-center text-suave max-sm:hidden">…</span>
              ) : (
                <Link
                  href={ir(n)}
                  scroll={false}
                  aria-label={`Página ${n}`}
                  aria-current={n === pagina ? "page" : undefined}
                  className={`${claseCelda} text-tenue hover:bg-white hover:text-tinta hover:shadow-control aria-[current=page]:bg-marca aria-[current=page]:text-white aria-[current=page]:shadow-boton`}
                >
                  {n}
                </Link>
              )}
            </li>
          ))}
          {/* En celular solo "Página X de Y" entre las flechas. */}
          <li className="text-sm tabular-nums text-tenue sm:hidden">
            Página <span className="font-semibold text-tinta">{pagina}</span> de {totalPaginas}
          </li>
          <li>
            {pagina < totalPaginas ? (
              <Link href={ir(pagina + 1)} scroll={false} aria-label="Página siguiente" className={`${claseCelda} bg-white text-tinta shadow-control ring-1 ring-inset ring-borde-fuerte hover:bg-marca-50 hover:text-marca`}>
                <Icono nombre="chevronDer" className="size-4" />
              </Link>
            ) : (
              <span aria-hidden className={`${claseCelda} text-suave ring-1 ring-inset ring-borde`}>
                <Icono nombre="chevronDer" className="size-4" />
              </span>
            )}
          </li>
        </ul>
      )}
    </nav>
  );
}
