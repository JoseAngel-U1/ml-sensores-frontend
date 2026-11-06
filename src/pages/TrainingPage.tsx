import { useState } from "react";
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
import { useCaptureSave } from "../hooks/useCaptureSave";
import type { Actividad } from "../types/records";

function TrainingCapture() {
  const { estado, preparacion, segundos, resultado, iniciar } = useSensorCapture();
  const [actividad, setActividad] = useState<Actividad>("caminando");
  const {
    estadoGuardado,
    mensajeGuardado,
    errorGuardado,
    guardadoEnCurso,
    reiniciarGuardado,
    reintentarGuardado,
  } = useCaptureSave({ tipo: "entrenamiento", actividad, resultado });
  const bloqueado = estado === "Preparando..." || estado === "Capturando..." || guardadoEnCurso;

  function iniciarCaptura(): void {
    if (!reiniciarGuardado()) return;
    iniciar();
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
