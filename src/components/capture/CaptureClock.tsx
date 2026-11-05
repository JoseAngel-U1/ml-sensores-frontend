import type { EstadoCaptura } from "../../types/sensores";

interface CaptureClockProps {
  estado: EstadoCaptura;
  tiempoTranscurrido: number;
  progreso: number;
  duracionObjetivo: number;
  preparacionRestante: number;
  duracionPreparacion: number;
}

const RADIO = 92;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

/**
 *! Presenta la cuenta regresiva de preparación y el temporizador de captura.
 ** No crea temporizadores ni accede a sensores: solo representa las props recibidas.
 */
export default function CaptureClock({
  estado,
  tiempoTranscurrido,
  progreso,
  duracionObjetivo,
  preparacionRestante,
  duracionPreparacion,
}: CaptureClockProps) {
  const enPreparacion = estado === "Preparando...";
  const progresoLimitado = Math.min(1, Math.max(0, progreso));
  const preparacionLimitada = Math.min(
    duracionPreparacion,
    Math.max(0, preparacionRestante)
  );
  const restante = enPreparacion
    ? preparacionLimitada
    : estado === "Captura finalizada"
      ? 0
      : Math.max(0, duracionObjetivo - Math.floor(tiempoTranscurrido));
  const progresoMostrado = enPreparacion
    ? duracionPreparacion > 0
      ? (duracionPreparacion - preparacionLimitada) / duracionPreparacion
      : 0
    : progresoLimitado;
  const activa = enPreparacion || estado === "Capturando...";

  return (
    <div
      className="capture-clock"
      role="group"
      aria-label={enPreparacion ? "Cuenta regresiva de preparación" : "Temporizador de captura"}
    >
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
          strokeDashoffset={CIRCUNFERENCIA * progresoMostrado}
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
