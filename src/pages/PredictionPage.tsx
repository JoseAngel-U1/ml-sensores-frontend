import { NavLink, useMatch } from "react-router-dom";
import CaptureClock from "../components/capture/CaptureClock";
import CaptureControls from "../components/capture/CaptureControls";
import CaptureResult from "../components/capture/CaptureResult";
import {
  DURACION_CAPTURA_SEGUNDOS,
  DURACION_PREPARACION_SEGUNDOS,
  useSensorCapture,
} from "../hooks/useSensorCapture";

function PredictionCapture() {
  const { estado, preparacion, segundos, resultado, iniciar } = useSensorCapture();

  return (
    <section className="capture-workspace" aria-label="Captura para predicción">
      <CaptureClock
        estado={estado}
        tiempoTranscurrido={segundos}
        progreso={segundos / DURACION_CAPTURA_SEGUNDOS}
        duracionObjetivo={DURACION_CAPTURA_SEGUNDOS}
        preparacionRestante={preparacion}
        duracionPreparacion={DURACION_PREPARACION_SEGUNDOS}
      />

      <CaptureControls estado={estado} onStart={iniciar} />
      {resultado && <CaptureResult resultado={resultado} />}
    </section>
  );
}

export default function PredictionPage() {
  const sincronizar = useMatch("/prediccion/sincronizar") !== null;

  return (
    <>
      <h1>Predicción</h1>
      <nav className="view-navigation" aria-label="Vistas de Predicción">
        <NavLink to="/prediccion" end>Captura</NavLink>
        <NavLink to="/prediccion/sincronizar" end>Sincronizar</NavLink>
      </nav>
      
      {sincronizar ? (
        <section className="surface-card" aria-labelledby="prediction-sync-title">
          <h2 id="prediction-sync-title">Sincronizar predicción</h2>
          <p className="text-secondary">Vista provisional. El listado de registros y la sincronización manual se incorporarán en tareas posteriores.</p>
        </section>
      ) : (
        <PredictionCapture />
      )}
    </>

  );
}
