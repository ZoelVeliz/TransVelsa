import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, usuarioDeToken } from "@/lib/sesion";

/**
 * Todo el panel exige sesión; solo /login queda abierto. Se consulta la sesión
 * en la base (una búsqueda por índice) para que desactivar a un usuario lo saque
 * de inmediato, también de las páginas. Las Server Actions y la descarga de
 * Excel vuelven a revisar la sesión por su cuenta (exigirSesion).
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(COOKIE_SESION)?.value;
  const usuario = token ? await usuarioDeToken(token) : null;

  if (pathname === "/login") {
    return usuario ? NextResponse.redirect(new URL("/viajes", req.url)) : NextResponse.next();
  }
  if (usuario) return NextResponse.next();

  const login = new URL("/login", req.url);
  if (pathname !== "/" && pathname !== "/viajes") login.searchParams.set("volver", pathname + search);
  const respuesta = NextResponse.redirect(login);
  // Cookie que ya no sirve (vencida o usuario desactivado): se limpia.
  if (token) respuesta.cookies.delete(COOKIE_SESION);
  return respuesta;
}

// Corre en todo menos archivos internos de Next y el logo (lo usa el login).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|Transveliz\\.jpeg).*)"],
};
