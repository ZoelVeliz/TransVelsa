import { tokenConFormato } from "@/lib/choferes";

// Manifest por chofer: start_url y scope llevan su token para que la app
// instalada abra directo en sus viajes (en iPhone no hay cookies compartidas
// con Safari). No consulta la base: un token inválido abrirá la pantalla
// "Enlace no válido", igual que en el navegador.
export async function GET(_req: Request, ctx: RouteContext<"/c/[token]/manifest.webmanifest">) {
  const { token } = await ctx.params;
  if (!tokenConFormato(token)) {
    return new Response("No encontrado", { status: 404 });
  }
  const inicio = `/c/${token}`;
  const manifest = {
    id: inicio,
    name: "TransVelsa Choferes",
    short_name: "TransVelsa",
    description: "Tus viajes asignados: inicia la ruta y marca la entrega.",
    lang: "es",
    dir: "ltr",
    start_url: inicio,
    scope: inicio,
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
