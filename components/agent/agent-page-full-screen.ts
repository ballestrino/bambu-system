// En la app instalada en el celular, la página del agente ocupa toda la
// pantalla, tapando el header de Bambú. Llega hasta abajo: en el historial,
// los tabs flotan encima (la lista deja su lugar al final, con
// --bottom-tabs-space) y en una conversación se esconden (data-agent-view,
// app/globals.css). Vive fuera de los componentes "use client" para que la use
// también el fallback de la página, que es un Server Component.
export const agentPageFullScreen =
  "app-tabs:fixed app-tabs:inset-x-0 app-tabs:top-0 app-tabs:bottom-0 app-tabs:z-45 app-tabs:h-auto app-tabs:min-h-0 app-tabs:max-w-none app-tabs:gap-0 app-tabs:bg-ops-surface app-tabs:pt-[env(safe-area-inset-top)]";
