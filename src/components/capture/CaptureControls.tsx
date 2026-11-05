import { useId } from "react";
import type { EstadoCaptura } from "../../types/sensores";

interface CaptureControlsProps {
  estado: EstadoCaptura;
  onStart: () => void;
}

const ETIQUETAS: Record<EstadoCaptura, string> = {
  "Listo para iniciar": "Iniciar captura",
  "Capturando...": "Capturando…",
  "Captura finalizada": "Nueva captura",
};

const AYUDAS: Record<EstadoCaptura, string> = {
  "Listo para iniciar": "La captura dura 10 segundos y se inicia manualmente.",
  "Capturando...": "Captura en curso. Mantén esta vista abierta hasta finalizar.",
  "Captura finalizada": "Captura completada. Las mediciones permanecen en memoria.",
};

/**
 *! Controles visuales de captura. La sesión la controla el hook del consumidor.
 ** El botón se deshabilita durante la captura para evitar inicios duplicados.
 */
export default function CaptureControls({ estado, onStart }: CaptureControlsProps) {
  const ayudaId = useId();
  const capturando = estado === "Capturando...";

  return (
    <div className="capture-controls">
      <button
        type="button"
        onClick={onStart}
        disabled={capturando}
        aria-describedby={ayudaId}
      >
        {ETIQUETAS[estado]}
      </button>
      <p
        id={ayudaId}
        className="capture-controls__hint"
        data-estado={estado}
        role="status"
        aria-live="polite"
      >
        {AYUDAS[estado]}
      </p>
    </div>
  );
}
