import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  // Solo en desarrollo: permite abrir la app desde un celular en la misma red WiFi.
  allowedDevOrigins: ["192.168.1.162"],
  cacheComponents: true,
  partialPrefetching: true,
  // Los metadatos (enlace al manifest, ícono de iPhone) van siempre en <head>:
  // Chrome y Safari solo los buscan ahí al "Agregar a pantalla de inicio".
  // generateMetadata solo lee el token de la URL, así que no retrasa nada.
  htmlLimitedBots: /.*/,
  // El token del chofer va en la URL: que no se filtre a otros sitios ni a buscadores.
  headers() {
    return Promise.resolve([
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ]);
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
