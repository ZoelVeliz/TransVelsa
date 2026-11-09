// Genera los íconos de la app (PWA e iPhone) a partir del logo.
// Uso: npm run iconos   (vuelve a escribir los PNG de public/)
//
// El logo trae mucho margen negro: se recorta al dibujo y se centra sobre el
// mismo negro de marca, con más margen en el ícono "maskable" porque Android
// lo recorta en círculo o en gota.
import sharp from "sharp";

const ORIGEN = "public/Transveliz.jpeg";
const FONDO = { r: 0, g: 0, b: 0, alpha: 1 };

const recortado = await sharp(ORIGEN).trim({ background: "#000000", threshold: 24 }).toBuffer();

async function icono(destino, lado, ocupa) {
  const ancho = Math.round(lado * ocupa);
  const dibujo = await sharp(recortado)
    .resize({ width: ancho, height: ancho, fit: "inside", background: FONDO })
    .toBuffer();
  await sharp({ create: { width: lado, height: lado, channels: 4, background: FONDO } })
    .composite([{ input: dibujo, gravity: "centre" }])
    .flatten({ background: FONDO })
    .png({ compressionLevel: 9 })
    .toFile(destino);
  console.log("ok", destino);
}

await icono("public/icono-192.png", 192, 0.9);
await icono("public/icono-512.png", 512, 0.9);
await icono("public/icono-maskable-512.png", 512, 0.72);
await icono("public/apple-touch-icon.png", 180, 0.86);
await icono("app/icon.png", 64, 0.94);
