"use client";

import { useEffect, useState } from "react";

const PHONE_QUERY = "(max-width: 767px)";

// null hasta conocer el ancho: el creador no pinta el escritorio en un
// celular para cambiarlo un instante después.
export const useIsPhone = () => {
  const [isPhone, setIsPhone] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia(PHONE_QUERY);
    const update = () => setIsPhone(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isPhone;
};
