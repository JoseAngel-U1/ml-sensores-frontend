import { useState } from "react";

type Tema = "claro" | "oscuro";

const THEME_STORAGE_KEY = "ml-sensores-tema";

export function useTheme() {
  // index.html aplica la preferencia antes del primer render.
  const [tema, setTema] = useState<Tema>(() =>
    document.documentElement.dataset.theme === "dark" ? "oscuro" : "claro",
  );

  function alternarTema(): void {
    const siguienteTema: Tema = tema === "claro" ? "oscuro" : "claro";
    document.documentElement.dataset.theme = siguienteTema === "oscuro" ? "dark" : "light";
    setTema(siguienteTema);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, siguienteTema);
    } catch {
      // Si el almacenamiento no está disponible, el cambio sigue activo en esta sesión.
    }
  }

  return { tema, alternarTema };
}
