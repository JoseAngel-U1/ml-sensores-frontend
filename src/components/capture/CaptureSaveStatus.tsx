import type { EstadoGuardadoCaptura } from "../../types/records";

interface CaptureSaveStatusProps {
  estado: EstadoGuardadoCaptura;
  mensaje: string | null;
  error: string | null;
  puedeReintentar: boolean;
  onReintentar: () => void;
}

export default function CaptureSaveStatus({
  estado,
  mensaje,
  error,
  puedeReintentar,
  onReintentar,
}: CaptureSaveStatusProps) {
  if (estado === "inactivo") return null;

  if (estado === "guardando") {
    return (
      <p className="capture-save-status" role="status" aria-live="polite">
        Guardando captura en SQLite…
      </p>
    );
  }

  if (estado === "guardado") {
    return (
      <p className="capture-save-status capture-save-status--success" role="status">
        {mensaje ?? "Captura guardada localmente."}
      </p>
    );
  }

  if (estado === "incompleta") {
    return (
      <p className="capture-save-status capture-save-status--warning" role="alert">
        {mensaje ?? "La captura no se guardó porque contiene mediciones incompletas."}
      </p>
    );
  }

  return (
    <div className="capture-save-status capture-save-status--error">
      <p role="alert">{error ?? "No se pudo guardar la captura."}</p>
      <button
        type="button"
        className="button--secondary"
        onClick={onReintentar}
        disabled={!puedeReintentar}
      >
        Reintentar guardado
      </button>
    </div>
  );
}
