import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { useNavigate } from "react-router-dom";

/** Conecta Atrás físico con el historial del Router; un interceptor opcional puede consumirlo antes de navegar. */
export function useAndroidBackNavigation(manejarAtras?: () => boolean): void {
  const navigate = useNavigate();
  const manejarAtrasRef = useRef(manejarAtras);

  useEffect(() => {
    manejarAtrasRef.current = manejarAtras;
  }, [manejarAtras]);

  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;

    let active = true;
    const listener = App.addListener("backButton", ({ canGoBack }) => {
      if (!active) return;

      if (manejarAtrasRef.current?.()) return;

      if (canGoBack) {
        void navigate(-1);
      } else {
        // Solo se sale cuando Android indica que no queda historial para volver.
        void App.exitApp().catch((error: unknown) => {
          console.error("No se pudo salir de la aplicación:", error);
        });
      }
    });

    void listener.catch((error: unknown) => {
      console.error("No se pudo registrar el botón Atrás. Verifica la sincronización de Capacitor:", error);
    });

    return () => {
      active = false;
      // Espera el registro asíncrono incluso si StrictMode ya desmontó el efecto.
      // Se retira únicamente este listener, sin afectar otros consumidores de App.
      void listener.then((handle) => handle.remove()).catch((error: unknown) => {
        console.error("No se pudo liberar el listener de Atrás:", error);
      });
    };
  }, [navigate]);
}
