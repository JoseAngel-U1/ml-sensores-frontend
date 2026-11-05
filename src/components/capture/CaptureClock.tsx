import type { EstadoCaptura } from "../../types/sensores";

interface CaptureClockProps {
  estado: EstadoCaptura;
  tiempoTranscurrido: number;
  progreso: number;
  duracionObjetivo: number;
}

const RADIO = 92;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

/**
 *! Presenta el temporizador circular de una captura.
 ** No crea temporizadores ni accede a sensores: solo representa las props recibidas.
 */
export default function CaptureClock({
  estado,
  tiempoTranscurrido,
  progreso,
  duracionObjetivo,
}: CaptureClockProps) {
  const progresoLimitado = Math.min(1, Math.max(0, progreso));
  const restante =
    estado === "Captura finalizada"
      ? 0
      : Math.max(0, duracionObjetivo - Math.floor(tiempoTranscurrido));
  const activa = estado === "Capturando...";

  return (
    <div className="capture-clock" role="group" aria-label="Temporizador de captura">
      <svg
        className="capture-clock__ring"
        viewBox="0 0 220 220"
        aria-hidden="true"
        focusable="false"
      >
        <circle className="capture-clock__track" cx="110" cy="110" r={RADIO} />
        <circle
          className="capture-clock__progress"
          cx="110"
          cy="110"
          r={RADIO}
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={CIRCUNFERENCIA * progresoLimitado}
        />
      </svg>
      <div className="capture-clock__readout">
        <p className="capture-clock__time">
          <span className="capture-clock__value">{restante}</span>
          <span className="capture-clock__unit">s</span>
        </p>
        <p className="capture-clock__state">
          <span
            className={`capture-clock__dot${activa ? " capture-clock__dot--active" : ""}`}
            aria-hidden="true"
          />
          {estado}
        </p>
      </div>
    </div>
  );
}
