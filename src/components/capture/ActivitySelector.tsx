import { useId } from "react";
import type { Actividad } from "../../types/records";

interface ActivitySelectorProps {
  value: Actividad | null;
  onChange: (actividad: Actividad) => void;
  disabled?: boolean;
}

interface OpcionActividad {
  valor: Actividad;
  etiqueta: string;
}

const OPCIONES: readonly OpcionActividad[] = [
  { valor: "quieto", etiqueta: "Quieto" },
  { valor: "caminando", etiqueta: "Caminando" },
  { valor: "corriendo", etiqueta: "Corriendo" },
];

function ActivityIcon({ actividad }: { actividad: Actividad }) {
  if (actividad === "quieto") {
    return (
      <svg
        className="activity-selector__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="4.5" r="2" />
        <path d="M7 21v-4l3-2 2 2 2-2 3 2v4" />
        <path d="M8 12h8" />
      </svg>
    );
  }

  if (actividad === "caminando") {
    return (
      <svg
        className="activity-selector__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="13" cy="4.5" r="2" />
        <path d="M11 21l2-6 3-2 1-4 3 3" />
        <path d="M9 12l4-2 1 4 3 1" />
        <path d="M6 21l3-5" />
      </svg>
    );
  }

  return (
    <svg
      className="activity-selector__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="15" cy="4.5" r="2" />
      <path d="M8 21l4-5-2-4 4-3 3 3 2 4" />
      <path d="M6 11l4-1 2 3 4 1" />
      <path d="M4 21l4-4" />
    </svg>
  );
}

/**
 *! Selector accesible de actividad para capturas de entrenamiento.
 ** No persiste datos ni conoce sensores; comunica la selección mediante props.
 */
export default function ActivitySelector({
  value,
  onChange,
  disabled = false,
}: ActivitySelectorProps) {
  const nombreGrupo = useId();

  return (
    <fieldset className="activity-selector" disabled={disabled}>
      <legend className="activity-selector__legend">Actividad</legend>
      <div className="activity-selector__options">
        {OPCIONES.map((opcion) => (
          <label className="activity-selector__option" key={opcion.valor}>
            <input
              type="radio"
              name={nombreGrupo}
              value={opcion.valor}
              checked={value === opcion.valor}
              onChange={() => onChange(opcion.valor)}
            />
            <span className="activity-selector__content">
              <ActivityIcon actividad={opcion.valor} />
              <span>{opcion.etiqueta}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
