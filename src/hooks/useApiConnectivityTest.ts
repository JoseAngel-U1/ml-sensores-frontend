import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, checkApiConnectivity } from "../services/api";

type EstadoTestApi =
  | { estado: "inicial" }
  | { estado: "comprobando" }
  | { estado: "exito"; codigoHttp: number; tiempoMs: number }
  | { estado: "error"; codigoHttp?: number; tiempoMs: number; mensaje: string };

interface UseApiConnectivityTestResult {
  estado: EstadoTestApi;
  comprobando: boolean;
  comprobarConexion: () => Promise<void>;
}

function mensajeError(cause: unknown): string {
  if (cause instanceof Error && cause.message.trim()) {
    return cause.message;
  }

  return "No se pudo completar la comprobación de la conexión.";
}

/** Ejecuta la prueba manual de conectividad de Test API y expone sus estados visuales. */
export function useApiConnectivityTest(): UseApiConnectivityTestResult {
  const [estado, setEstado] = useState<EstadoTestApi>({ estado: "inicial" });
  const enCursoRef = useRef(false);
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const comprobarConexion = useCallback(async (): Promise<void> => {
    if (enCursoRef.current) return;
    enCursoRef.current = true;
    if (montadoRef.current) setEstado({ estado: "comprobando" });

    const inicio = performance.now();
    try {
      const resultado = await checkApiConnectivity();
      if (montadoRef.current) {
        setEstado({
          estado: "exito",
          codigoHttp: resultado.status,
          tiempoMs: resultado.elapsedMs,
        });
      }
    } catch (cause: unknown) {
      const codigoHttp = cause instanceof ApiError ? cause.status : undefined;
      const tiempoMs = Math.round(performance.now() - inicio);
      if (montadoRef.current) {
        setEstado({
          estado: "error",
          codigoHttp,
          tiempoMs,
          mensaje: mensajeError(cause),
        });
      }
    } finally {
      enCursoRef.current = false;
    }
  }, []);

  return {
    estado,
    comprobando: estado.estado === "comprobando",
    comprobarConexion,
  };
}
