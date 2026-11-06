import { useCallback, useEffect, useRef, useState } from "react";
import { getRecordSummaries } from "../services/database";
import type { RegistroResumen, TipoRegistro } from "../types/records";

interface UseRecordSummariesResult {
  registros: RegistroResumen[];
  cargando: boolean;
  error: string | null;
  actualizar: () => void;
}

function mensajeError(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

export function useRecordSummaries(tipo: TipoRegistro): UseRecordSummariesResult {
  const [registros, setRegistros] = useState<RegistroResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const peticionRef = useRef(0);
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const consultar = useCallback(async (): Promise<void> => {
    const peticion = ++peticionRef.current;
    if (montadoRef.current) {
      setCargando(true);
      setError(null);
    }

    try {
      const resultado = await getRecordSummaries(tipo);
      if (!montadoRef.current || peticion !== peticionRef.current) return;
      setRegistros(resultado);
    } catch (cause: unknown) {
      if (!montadoRef.current || peticion !== peticionRef.current) return;
      setError(mensajeError(cause));
    } finally {
      if (montadoRef.current && peticion === peticionRef.current) {
        setCargando(false);
      }
    }
  }, [tipo]);

  useEffect(() => {
    queueMicrotask(() => {
      if (montadoRef.current) void consultar();
    });
  }, [consultar]);

  const actualizar = useCallback((): void => {
    void consultar();
  }, [consultar]);

  return { registros, cargando, error, actualizar };
}
