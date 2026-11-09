import { useCallback, useEffect, useRef, useState } from "react";
import { getRecordById, saveRecord } from "../services/database";
import type { Actividad, EstadoGuardadoCaptura, Registro, TipoRegistro } from "../types/records";
import type { ResultadoCaptura } from "../types/sensores";

interface CapturaPendiente {
  id: string;
  fecha: string;
  tipo: TipoRegistro;
  actividad: Actividad | null;
  participanteId: string | null;
  resultado: ResultadoCaptura;
}

type UseCaptureSaveOptions =
  | { tipo: "entrenamiento"; actividad: Actividad; participanteId: string | null; resultado: ResultadoCaptura | null }
  | { tipo: "prediccion"; actividad: null; resultado: ResultadoCaptura | null };

interface UseCaptureSaveResult {
  estadoGuardado: EstadoGuardadoCaptura;
  mensajeGuardado: string | null;
  errorGuardado: string | null;
  guardadoEnCurso: boolean;
  reiniciarGuardado: () => boolean;
  reintentarGuardado: () => void;
}

function esMismoRegistro(guardado: Registro, esperado: Registro): boolean {
  return guardado.id === esperado.id
    && guardado.tipo === esperado.tipo
    && guardado.actividad === esperado.actividad
    && guardado.participante_id === esperado.participante_id
    && guardado.fecha === esperado.fecha
    && guardado.duracion_ms === esperado.duracion_ms
    && guardado.frecuencia_hz === esperado.frecuencia_hz
    && JSON.stringify(guardado.mediciones) === JSON.stringify(esperado.mediciones);
}

export function useCaptureSave(options: UseCaptureSaveOptions): UseCaptureSaveResult {
  const { tipo, actividad, resultado } = options;
  const participanteId = options.tipo === "entrenamiento" ? options.participanteId : null;
  const [estadoGuardado, setEstadoGuardado] = useState<EstadoGuardadoCaptura>("inactivo");
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const pendienteRef = useRef<CapturaPendiente | null>(null);
  const ultimoResultadoRef = useRef<ResultadoCaptura | null>(null);
  const guardandoRef = useRef(false);
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const guardarCaptura = useCallback(async (pendiente: CapturaPendiente): Promise<void> => {
    if (guardandoRef.current) return;
    guardandoRef.current = true;
    if (montadoRef.current) {
      setEstadoGuardado("guardando");
      setMensajeGuardado(null);
      setErrorGuardado(null);
    }

    const registro: Registro = {
      id: pendiente.id,
      tipo: pendiente.tipo,
      actividad: pendiente.actividad,
      ...(pendiente.tipo === "entrenamiento" ? { participante_id: pendiente.participanteId } : {}),
      fecha: pendiente.fecha,
      duracion_ms: pendiente.resultado.duracion_ms,
      frecuencia_hz: pendiente.resultado.frecuencia_hz,
      mediciones: pendiente.resultado.medicionesCompletas,
      estado_sync: "pendiente",
    };

    try {
      await saveRecord(registro);
      if (montadoRef.current) {
        setEstadoGuardado("guardado");
        setMensajeGuardado(`Captura guardada en SQLite. UUID: ${registro.id}.`);
      }
    } catch (cause: unknown) {
      let recuperado: Registro | null;
      try {
        recuperado = await getRecordById(registro.id);
      } catch {
        recuperado = null;
      }
      if (recuperado !== null && esMismoRegistro(recuperado, registro)) {
        if (montadoRef.current) {
          setEstadoGuardado("guardado");
          setMensajeGuardado(`Captura ya guardada en SQLite. UUID: ${registro.id}.`);
        }
      } else if (montadoRef.current) {
        setEstadoGuardado("error");
        setErrorGuardado(cause instanceof Error ? cause.message : String(cause));
      }
    } finally {
      guardandoRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (resultado === null || ultimoResultadoRef.current === resultado) return;
    ultimoResultadoRef.current = resultado;

    queueMicrotask(() => {
      if (!montadoRef.current) return;

      if (tipo === "entrenamiento" && !participanteId) {
        pendienteRef.current = null;
        setEstadoGuardado("incompleta");
        setMensajeGuardado("Captura no guardada: falta el participante seleccionado al iniciar.");
        return;
      }

      const sinMedicionesValidas = resultado.medicionesCompletas.length === 0;
      const metricasInvalidas = !Number.isFinite(resultado.duracion_ms)
        || resultado.duracion_ms <= 0
        || !Number.isFinite(resultado.frecuencia_hz)
        || resultado.frecuencia_hz <= 0;

      if (resultado.invalidas > 0 || sinMedicionesValidas || metricasInvalidas) {
        pendienteRef.current = null;
        setEstadoGuardado("incompleta");
        setErrorGuardado(null);
        setMensajeGuardado(
          resultado.invalidas > 0
            ? `Captura no guardada: ${resultado.invalidas} de ${resultado.total} mediciones están incompletas. Repite la captura.`
            : "Captura no guardada: no contiene mediciones o métricas válidas. Repite la captura."
        );
        return;
      }

      const pendiente: CapturaPendiente = {
        id: crypto.randomUUID(),
        fecha: new Date().toISOString(),
        tipo,
        actividad,
        participanteId,
        resultado,
      };
      pendienteRef.current = pendiente;
      void guardarCaptura(pendiente);
    });
  }, [resultado, tipo, actividad, participanteId, guardarCaptura]);

  const reiniciarGuardado = useCallback((): boolean => {
    if (guardandoRef.current) return false;
    pendienteRef.current = null;
    ultimoResultadoRef.current = null;
    setEstadoGuardado("inactivo");
    setMensajeGuardado(null);
    setErrorGuardado(null);
    return true;
  }, []);

  const reintentarGuardado = useCallback((): void => {
    const pendiente = pendienteRef.current;
    if (pendiente === null) return;
    void guardarCaptura(pendiente);
  }, [guardarCaptura]);

  return {
    estadoGuardado,
    mensajeGuardado,
    errorGuardado,
    guardadoEnCurso: estadoGuardado === "guardando",
    reiniciarGuardado,
    reintentarGuardado,
  };
}
