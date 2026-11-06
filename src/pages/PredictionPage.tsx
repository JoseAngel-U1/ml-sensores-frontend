import { NavLink, useMatch } from "react-router-dom";
import CaptureClock from "../components/capture/CaptureClock";
import CaptureControls from "../components/capture/CaptureControls";
import CaptureResult from "../components/capture/CaptureResult";
import CaptureSaveStatus from "../components/capture/CaptureSaveStatus";
import RecordsSyncView from "../components/records/RecordsSyncView";
import {
  DURACION_CAPTURA_SEGUNDOS,
  DURACION_PREPARACION_SEGUNDOS,
  useSensorCapture,
} from "../hooks/useSensorCapture";
import { useCaptureSave } from "../hooks/useCaptureSave";

function PredictionCapture() {
  const { estado, preparacion, segundos, resultado, iniciar } = useSensorCapture();
  const {
    estadoGuardado,
    mensajeGuardado,
    errorGuardado,
    guardadoEnCurso,
    reiniciarGuardado,
    reintentarGuardado,
  } = useCaptureSave({ tipo: "prediccion", actividad: null, resultado });

  function iniciarCaptura(): void {
    if (!reiniciarGuardado()) return;
    iniciar();
  }

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
        <RecordsSyncView tipo="prediccion" />
      ) : (
        <PredictionCapture />
      )}
    </>

  );
}
