// Crea una cuenta de ADMINISTRADOR con una contraseña temporal (se muestra una vez).
// Sirve para la primera cuenta (antes de eso nadie puede entrar al panel) o para
// recuperar el acceso si se pierden todos los administradores.
// Uso: npm run usuario:admin -- <usuario> "<Nombre completo>"
//   ej. npm run usuario:admin -- zoel "Zoel Veliz"
import { eq } from "drizzle-orm";
import { hashPassword, passwordTemporal } from "../lib/contrasenas";
import { db, usuarios } from "../lib/db";

const FORMATO_USUARIO = /^[a-z0-9][a-z0-9._-]{2,29}$/;

async function main() {
  const [usuarioArg, ...resto] = process.argv.slice(2);
  const usuario = (usuarioArg ?? "").trim().toLowerCase();
  const nombre = resto.join(" ").trim();
  if (!FORMATO_USUARIO.test(usuario) || !nombre) {
    console.error('Uso: npm run usuario:admin -- <usuario> "<Nombre completo>"');
    console.error("El usuario: 3 a 30 letras minúsculas, números, punto, guion o guion bajo.");
    process.exit(1);
  }
  const [existe] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.usuario, usuario));
  if (existe) {
    console.error(`El usuario "${usuario}" ya existe. Elige otro nombre.`);
    process.exit(1);
  }
  const temporal = passwordTemporal();
  await db.insert(usuarios).values({ usuario, nombre, passwordHash: await hashPassword(temporal), esAdmin: true });
  console.log("\nAdministrador creado.");
  console.log(`  Usuario:              ${usuario}`);
  console.log(`  Contraseña temporal:  ${temporal}`);
  console.log("\nEntra al panel y cámbiala en Usuarios › Mi cuenta. No se vuelve a mostrar.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
