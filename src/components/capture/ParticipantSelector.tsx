import type { Participante } from "../../types/records";

interface ParticipantSelectorProps {
  participantes: Participante[];
  seleccionado: string;
  onChange: (codigo: string) => void;
  onAgregar: () => void;
  onEliminar: () => void;
  onReintentar: () => void;
  disabled: boolean;
  ocupado: boolean;
  error: string | null;
  mensaje: string | null;
}

export default function ParticipantSelector({
  participantes, seleccionado, onChange, onAgregar, onEliminar,
  onReintentar, disabled, ocupado, error, mensaje,
}: ParticipantSelectorProps) {
  const bloqueado = disabled || ocupado;
  return (
    <div className="participant-selector">
      <div className="participant-selector__row" role="group" aria-label="Participantes" aria-busy={ocupado}>
        <select
          aria-label="Participante de entrenamiento"
          value={seleccionado}
          disabled={bloqueado}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{participantes.length === 0 ? "Sin participantes" : "Selecciona participante"}</option>
          {participantes.map((p) => <option key={p.id} value={p.codigo}>{p.codigo}</option>)}
        </select>
        <button
          type="button"
          className="participant-selector__button"
          aria-label="Agregar participante"
          title="Agregar participante"
          disabled={bloqueado}
          onClick={onAgregar}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          className="participant-selector__button button--secondary"
          aria-label={seleccionado ? `Eliminar participante ${seleccionado}` : "Eliminar participante"}
          title="Eliminar participante seleccionado"
          disabled={bloqueado || !seleccionado}
          onClick={onEliminar}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
          </svg>
        </button>
      </div>
      {ocupado && <p role="status">Procesando participantes…</p>}
      {mensaje && <p role="status">{mensaje}</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button type="button" className="button--secondary" disabled={bloqueado} onClick={onReintentar}>Reintentar consulta</button>
        </div>
      )}
    </div>
  );
}
