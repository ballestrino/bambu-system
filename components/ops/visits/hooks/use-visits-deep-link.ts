"use client";

import { useEffect, useRef } from "react";

import {
  toVisitsView,
  VISITS_VIEW_STORAGE_KEY,
  type VisitsDesk,
} from "@/components/ops/visits/hooks/use-visits-desk";

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

// Links de Inicio a Visitas: ?vista= abre una vista (pendientes, agenda,
// cron, dia), ?dia= un dia y ?visita= el detalle de una visita. Se leen una
// vez al montar, despues de hidratar, y se sacan de la URL para que recargar
// respete lo que la persona eligio despues.
export const useVisitsDeepLink = (desk: VisitsDesk) => {
  // Solo se usa al montar: el escritorio del primer render alcanza.
  const deskRef = useRef(desk);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("vista");
    const day = params.get("dia");
    const visit = params.get("visita");
    if (!view && !day && !visit) return;

    const current = deskRef.current;
    if (view) {
      // Tambien en el navegador: la vista guardada se vuelve a leer al montar
      // (dos veces en desarrollo) y no debe pisar la del link.
      try {
        window.localStorage.setItem(VISITS_VIEW_STORAGE_KEY, JSON.stringify({ view: toVisitsView(view) }));
      } catch {}
      current.setView(toVisitsView(view));
    }
    if (day && DAY_KEY.test(day)) current.goToDay(day);
    if (visit) current.open(visit, "detalle");
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }, []);
};
