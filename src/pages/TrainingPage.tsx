import { useState } from "react";
import { NavLink, useMatch } from "react-router-dom";
import ActivitySelector from "../components/capture/ActivitySelector";
import ParticipantSelector from "../components/capture/ParticipantSelector";
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
import { useParticipants } from "../hooks/useParticipants";
import type { Actividad } from "../types/records";

function TrainingCapture() {
  const { estado, preparacion, segundos, resultado, iniciar } = useSensorCapture();
  const [actividad, setActividad] = useState<Actividad>("caminando");
  const participantes = useParticipants();
  const [sesion, setSesion] = useState<{ actividad: Actividad; participanteId: string } | null>(null);
  const {
    estadoGuardado,
    mensajeGuardado,
    errorGuardado,
    guardadoEnCurso,
    reiniciarGuardado,
    reintentarGuardado,
  } = useCaptureSave({
    tipo: "entrenamiento", actividad: sesion?.actividad ?? actividad,
    participanteId: sesion?.participanteId ?? null, resultado,
  });
  const bloqueado = estado === "Preparando..." || estado === "Capturando..." || guardadoEnCurso;

  function iniciarCaptura(): void {
    if (bloqueado || participantes.ocupado || participantes.hayOperacionEnCurso()
      || !participantes.participantes.some((p) => p.codigo === participantes.seleccionado)) return;
    if (!reiniciarGuardado()) return;
    setSesion({ actividad, participanteId: participantes.seleccionado });
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

        <ParticipantSelector
          participantes={participantes.participantes}
          seleccionado={participantes.seleccionado}
          onChange={participantes.setSeleccionado}
          onAgregar={participantes.agregar}
          onEliminar={participantes.eliminar}
          onReintentar={participantes.actualizar}
          disabled={bloqueado || estadoGuardado === "error"}
          ocupado={participantes.ocupado}
          error={participantes.error}
          mensaje={participantes.mensaje}
        />

        <ActivitySelector
          value={actividad}
          onChange={setActividad}
          disabled={bloqueado}
        />

        <CaptureControls estado={estado} onStart={iniciarCaptura}
          disabled={guardadoEnCurso || participantes.ocupado || !participantes.seleccionado} />
        {sesion && (resultado || estado === "Preparando..." || estado === "Capturando...") && (
          <p className="text-secondary">Participante de esta captura: {sesion.participanteId}</p>
        )}
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
        <RecordsSyncView tipo="entrenamiento" />
      ) : (
        <TrainingCapture />
      )}
    </>
  );
}
