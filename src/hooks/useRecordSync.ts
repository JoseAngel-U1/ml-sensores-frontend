import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { sincronizarPendientes, sincronizarRegistro } from "../services/sync";
import { deletePendingRecord } from "../services/database";
import { hayOperacionRegistros, observarOperacionesRegistros } from "../services/recordOperations";
import type { ResumenSincronizacion } from "../services/sync";
import type { TipoRegistro } from "../types/records";

interface UseRecordSyncOptions {
  tipo: TipoRegistro;
  onFinalizado?: () => void;
}

interface UseRecordSyncResult {
  sincronizando: boolean;
  ocupado: boolean;
  resumen: ResumenSincronizacion | null;
  error: string | null;
  sincronizar: (idLocal?: string) => Promise<void>;
  eliminar: (idLocal: string) => Promise<void>;
}

function mensajeError(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

export function useRecordSync({ tipo, onFinalizado }: UseRecordSyncOptions): UseRecordSyncResult {
  const ocupado = useSyncExternalStore(observarOperacionesRegistros, hayOperacionRegistros);
  const [sincronizando, setSincronizando] = useState(false);
  const [resumen, setResumen] = useState<ResumenSincronizacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const enCursoRef = useRef(false);
  const montadoRef = useRef(true);
  const finalizadoRef = useRef(onFinalizado);

  useEffect(() => {
    finalizadoRef.current = onFinalizado;
  }, [onFinalizado]);

  // Refresca también una vista que se haya montado durante una operación previa.
  useEffect(() => {
    if (ocupado) return;
    let activo = true;
    queueMicrotask(() => {
      if (activo) finalizadoRef.current?.();
    });
    return () => { activo = false; };
  }, [ocupado]);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const sincronizar = useCallback(async (idLocal?: string): Promise<void> => {
    // El bloqueo se activa de forma síncrona para ignorar dobles pulsaciones.
    if (enCursoRef.current || hayOperacionRegistros() || tipo !== "prediccion") return;
    enCursoRef.current = true;
    if (montadoRef.current) {
      setSincronizando(true);
      setError(null);
      setResumen(null);
    }

    try {
      const resultado = idLocal === undefined
        ? await sincronizarPendientes(tipo)
        : await sincronizarRegistro(tipo, idLocal);
      if (montadoRef.current) setResumen(resultado);
    } catch (cause: unknown) {
      if (montadoRef.current) setError(mensajeError(cause));
    } finally {
      enCursoRef.current = false;
      if (montadoRef.current) {
        setSincronizando(false);
        // El servicio ya confirmó los UUID en SQLite; el refresco es solo visual.
        finalizadoRef.current?.();
      }
    }
  }, [tipo]);

  const eliminar = useCallback(async (idLocal: string): Promise<void> => {
    if (enCursoRef.current || hayOperacionRegistros()) return;
    enCursoRef.current = true;
    let confirmado = false;
    try {
      if (!window.confirm(`¿Eliminar el registro local ${idLocal} y todas sus mediciones? Esta acción no elimina documentos de MongoDB y no se puede deshacer.`)) return;
      confirmado = true;
      if (montadoRef.current) {
        setError(null);
        setResumen(null);
      }
      await deletePendingRecord(tipo, idLocal);
    } catch (cause: unknown) {
      if (montadoRef.current) setError(mensajeError(cause));
    } finally {
      enCursoRef.current = false;
      if (confirmado && montadoRef.current) finalizadoRef.current?.();
    }
  }, [tipo]);

  return { sincronizando, ocupado, resumen, error, sincronizar, eliminar };
}
