// Crea las tablas de acceso (usuarios y sesiones). Solo agrega tablas nuevas:
// no toca las existentes. Si ya existen, no hace nada.
// Uso: npm run db:usuarios
// SQL generado con drizzle-kit a partir de lib/db/schema.ts (mismos nombres de
// restricciones, para que un `db:push` posterior no vea diferencias).
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const [{ existe }] = await sql`select to_regclass('public.usuarios') is not null as existe`;
  if (existe) {
    console.log("Las tablas de usuarios ya existen. Nada que hacer.");
    return;
  }
  // Todo o nada: si una sentencia falla, no queda ninguna tabla a medias.
  await sql.transaction([
    sql`CREATE TABLE "usuarios" (
      "id" serial PRIMARY KEY NOT NULL,
      "usuario" text NOT NULL,
      "nombre" text NOT NULL,
      "password_hash" text NOT NULL,
      "es_admin" boolean DEFAULT false NOT NULL,
      "activo" boolean DEFAULT true NOT NULL,
      "intentos_fallidos" integer DEFAULT 0 NOT NULL,
      "bloqueado_hasta" timestamp,
      "ultimo_acceso" timestamp,
      "creado_en" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "usuarios_usuario_unique" UNIQUE("usuario")
    )`,
    sql`CREATE TABLE "sesiones" (
      "id" serial PRIMARY KEY NOT NULL,
      "token_hash" text NOT NULL,
      "usuario_id" integer NOT NULL,
      "vence" timestamp NOT NULL,
      "creado_en" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "sesiones_token_hash_unique" UNIQUE("token_hash")
    )`,
    sql`ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_usuario_id_usuarios_id_fk"
      FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action`,
    sql`CREATE INDEX "sesiones_usuario_id_idx" ON "sesiones" USING btree ("usuario_id")`,
  ]);
  console.log("Listo: tablas usuarios y sesiones creadas.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
