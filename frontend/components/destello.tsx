"use client";

import { useEffect } from "react";

/**
 * Brillo que sigue al cursor sobre las tarjetas con `data-destello`.
 * Un solo listener para toda la página (no uno por tarjeta) y como mucho una
 * actualización por cuadro. Solo con mouse; en táctil o con movimiento
 * reducido no hace nada (ver .destello en globals.css).
 */
export function Destello() {
  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let cuadro = 0;
    let ultimo: PointerEvent | null = null;
    const pintar = () => {
      cuadro = 0;
      const e = ultimo;
      if (!e) return;
      const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-destello]");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--dx", `${e.clientX - r.left}px`);
      el.style.setProperty("--dy", `${e.clientY - r.top}px`);
    };
    const mover = (e: PointerEvent) => {
      ultimo = e;
      cuadro ||= requestAnimationFrame(pintar);
    };
    document.addEventListener("pointermove", mover, { passive: true });
    return () => {
      document.removeEventListener("pointermove", mover);
      cancelAnimationFrame(cuadro);
    };
  }, []);
  return null;
}
