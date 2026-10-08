import { useEffect } from "react";

// Por debajo de esto el viewport se achicó por otra cosa (la barra de
// sugerencias de iOS, un zoom), no por el teclado.
const KEYBOARD_MIN_HEIGHT = 120;
// Con teclado físico (iPad) el foco no abre teclado: pasado este tiempo se
// recalcula con lo que de verdad mide el viewport.
const RECONCILE_MS = 600;

const isTextField = (element: Element | null) =>
  element instanceof HTMLTextAreaElement ||
  (element instanceof HTMLInputElement && !["checkbox", "radio", "button", "submit"].includes(element.type)) ||
  (element instanceof HTMLElement && element.isContentEditable);

// Alto del último teclado, para acomodar el agente apenas se enfoca el campo.
let lastKeyboardHeight = 0;

// iOS no achica la página al abrir el teclado: corre el viewport visual hacia
// arriba y se lleva el header. En la app instalada, mientras hay un campo
// enfocado y el teclado ocupa lugar, esto publica en <html> data-keyboard y el
// área visible (--keyboard-viewport-top y --keyboard-viewport-height); el CSS
// de app/globals.css acomoda el agente a esa área. Desde el segundo teclado se
// acomoda en el focus, antes de que iOS decida correr la pantalla. enabled
// apaga todo cuando el agente no está a la vista (el Sheet cerrado).
export const useKeyboardViewport = (enabled = true) => {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!enabled || !viewport || !window.matchMedia("(display-mode: standalone)").matches) return;
    const root = document.documentElement;
    let frame = 0;
    let reconcile = 0;

    const apply = (top: number, height: number) => {
      root.style.setProperty("--keyboard-viewport-top", `${top}px`);
      root.style.setProperty("--keyboard-viewport-height", `${height}px`);
      root.dataset.keyboard = "open";
    };
    const clear = () => {
      if (root.dataset.keyboard !== "open") return;
      delete root.dataset.keyboard;
      root.style.removeProperty("--keyboard-viewport-top");
      root.style.removeProperty("--keyboard-viewport-height");
    };
    const measure = () => {
      const keyboardHeight = root.clientHeight - viewport.height;
      if (isTextField(document.activeElement) && keyboardHeight > KEYBOARD_MIN_HEIGHT) {
        lastKeyboardHeight = keyboardHeight;
        apply(viewport.offsetTop, viewport.height);
      } else {
        clear();
      }
    };
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!isTextField(event.target as Element | null)) return;
      if (root.dataset.keyboard !== "open" && lastKeyboardHeight > 0) {
        apply(0, root.clientHeight - lastKeyboardHeight);
      }
      window.clearTimeout(reconcile);
      reconcile = window.setTimeout(update, RECONCILE_MS);
    };

    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", update);
      cancelAnimationFrame(frame);
      window.clearTimeout(reconcile);
      clear();
    };
  }, [enabled]);
};
