import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useMatch } from "react-router-dom";
import DatabaseTest from "../components/DatabaseTest";
import ActivitySelector from "../components/capture/ActivitySelector";
import CaptureClock from "../components/capture/CaptureClock";
import CaptureControls from "../components/capture/CaptureControls";
import CaptureResult from "../components/capture/CaptureResult";
import CaptureSaveStatus from "../components/capture/CaptureSaveStatus";
import {
  DURACION_CAPTURA_SEGUNDOS,
  DURACION_PREPARACION_SEGUNDOS,
  useSensorCapture,
} from "../hooks/useSensorCapture";
import { getRecordById, saveRecord } from "../services/database";
import type { Actividad, EstadoGuardadoCaptura, Registro } from "../types/records";
import type { ResultadoCaptura } from "../types/sensores";

interface CapturaPendiente {
  id: string;
  fecha: string;
  actividad: Actividad;
  resultado: ResultadoCaptura;
}

function esMismoRegistro(guardado: Registro, esperado: Registro): boolean {
  return guardado.id === esperado.id
    && guardado.tipo === esperado.tipo
    && guardado.actividad === esperado.actividad
    && guardado.fecha === esperado.fecha
    && guardado.duracion_ms === esperado.duracion_ms
    && guardado.frecuencia_hz === esperado.frecuencia_hz
    && JSON.stringify(guardado.mediciones) === JSON.stringify(esperado.mediciones);
}

function TrainingCapture() {
  const { estado, preparacion, segundos, resultado, iniciar } = useSensorCapture();
  const [actividad, setActividad] = useState<Actividad>("caminando");
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
      tipo: "entrenamiento",
      actividad: pendiente.actividad,
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
        actividad,
        resultado,
      };
      pendienteRef.current = pendiente;
      void guardarCaptura(pendiente);
    });
  }, [resultado, actividad, guardarCaptura]);

  const guardadoEnCurso = estadoGuardado === "guardando";
  const bloqueado = estado === "Preparando..." || estado === "Capturando..." || guardadoEnCurso;

  function iniciarCaptura(): void {
    if (guardandoRef.current) return;
    pendienteRef.current = null;
    ultimoResultadoRef.current = null;
    setEstadoGuardado("inactivo");
    setMensajeGuardado(null);
    setErrorGuardado(null);
    iniciar();
  }

  function reintentarGuardado(): void {
    const pendiente = pendienteRef.current;
    if (pendiente === null) return;
    void guardarCaptura(pendiente);
  }

  return (
    <>
      <section className="capture-workspace" aria-label="Captura de entrenamiento">
        <CaptureClock
          estado={estado}
          tiempoTranscurrido={segundos}
          progreso={segundos / DURACION_CAPTURA_SEGUNDOS}
          duracionObjetivo={DURACION_CAPTURA_SEGUNDOS}
          preparacionRestante={preparacion}
          duracionPreparacion={DURACION_PREPARACION_SEGUNDOS}
        />
        <ActivitySelector
          value={actividad}
          onChange={setActividad}
          disabled={bloqueado}
        />

        <CaptureControls estado={estado} onStart={iniciarCaptura} disabled={guardadoEnCurso} />
        {resultado && (
          <>
            <CaptureResult resultado={resultado} />
            <CaptureSaveStatus
              estado={estadoGuardado}
              mensaje={mensajeGuardado}
              error={errorGuardado}
              puedeReintentar={estadoGuardado === "error"}
              onReintentar={reintentarGuardado}
            />
          </>
        )}
      </section>

      <details className="surface-card capture-debug">
        <summary>Abrir prueba de SQLite (temporal)</summary>
        <div className="capture-test">
          <DatabaseTest />
        </div>
      </details>
    </>
  );
}

export default function TrainingPage() {
  const sincronizar = useMatch("/entrenamiento/sincronizar") !== null;

  return (
    <>
      <h1>Entrenamiento</h1>
      <nav className="view-navigation" aria-label="Vistas de Entrenamiento">
        <NavLink to="/entrenamiento" end>Captura</NavLink>
        <NavLink to="/entrenamiento/sincronizar" end>Sincronizar</NavLink>
      </nav>

      {sincronizar ? (
        <section className="surface-card" aria-labelledby="training-sync-title">
          <h2 id="training-sync-title">Sincronizar entrenamiento</h2>
          <p className="text-secondary">Vista provisional. El listado de registros y la sincronización manual se incorporarán en tareas posteriores.</p>
        </section>
      ) : (
        <TrainingCapture />
      )}
      
    </>
  );
}
