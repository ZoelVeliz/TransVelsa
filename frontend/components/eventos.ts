// Evento para abrir la paleta de comandos desde cualquier botón, sin importar
// el componente de la paleta (evita una dependencia circular con la navegación).
export const EVENTO_ABRIR_COMANDOS = "tv:abrir-comandos";

export function abrirComandos() {
  window.dispatchEvent(new Event(EVENTO_ABRIR_COMANDOS));
}
