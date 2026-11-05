import { useState } from "react";
import { NavLink, useMatch } from "react-router-dom";
import DatabaseTest from "../components/DatabaseTest";
import ActivitySelector from "../components/capture/ActivitySelector";
import CaptureClock from "../components/capture/CaptureClock";
import CaptureControls from "../components/capture/CaptureControls";
import CaptureResult from "../components/capture/CaptureResult";
import { useSensorCapture } from "../hooks/useSensorCapture";
import type { Actividad } from "../types/records";

const DURACION_OBJETIVO = 10;

function TrainingCapture() {
  const { estado, segundos, resultado, iniciar } = useSensorCapture();
  const [actividad, setActividad] = useState<Actividad>("caminando");
  const capturando = estado === "Capturando...";

  return (
    <>
      <section className="capture-workspace" aria-label="Captura de entrenamiento">
        <CaptureClock
          estado={estado}
          tiempoTranscurrido={segundos}
          progreso={segundos / DURACION_OBJETIVO}
          duracionObjetivo={DURACION_OBJETIVO}
        />

        <ActivitySelector
          value={actividad}
          onChange={setActividad}
          disabled={capturando}
        />

        <CaptureControls estado={estado} onStart={iniciar} />
        {resultado && <CaptureResult resultado={resultado} />}
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
