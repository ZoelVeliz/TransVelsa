import { PantallaAviso } from "@/components/marca";

export default function Portada() {
  return (
    <PantallaAviso icono="enlace" titulo="Abre el enlace personal que te envió la oficina">
      <p>
        Cada chofer tiene su propio enlace. Búscalo en tu WhatsApp y tócalo para ver tus viajes.
      </p>
      <p>¿No lo tienes o ya no funciona? Pídele uno nuevo a la oficina.</p>
    </PantallaAviso>
  );
}
