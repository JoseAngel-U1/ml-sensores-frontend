import type { Actividad, EstadoSync, RegistroResumen } from "../../types/records";

export interface AccionesRegistro {
  bloqueado: boolean;
  sincronizacionDisponible: boolean;
  sincronizar: (id: string) => void;
  eliminar: (id: string) => void;
}

interface RecordCardProps {
  registro: RegistroResumen;
  acciones?: AccionesRegistro;
}

const ETIQUETAS_ACTIVIDAD: Record<Actividad, string> = {
  quieto: "Quieto",
  caminando: "Caminando",
  corriendo: "Corriendo",
};

const ETIQUETAS_ESTADO: Record<EstadoSync, string> = {
  pendiente: "Pendiente",
  sincronizado: "Sincronizado",
};

const FORMATO_FECHA = new Intl.DateTimeFormat("es", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatearFecha(fecha: string): string {
  return FORMATO_FECHA.format(new Date(fecha));
}

function formatearDuracion(duracionMs: number): string {
  return `${(duracionMs / 1000).toFixed(2)} s`;
}

function formatearFrecuencia(frecuenciaHz: number): string {
  return `${frecuenciaHz.toFixed(2)} Hz`;
}

export default function RecordCard({ registro, acciones }: RecordCardProps) {
  const idTitulo = `record-card-${registro.id}`;
  const actividad = registro.actividad === null
    ? "Sin etiqueta"
    : ETIQUETAS_ACTIVIDAD[registro.actividad];

  return (
    <article className="surface-card record-card" aria-labelledby={idTitulo}>
      <header className="record-card__header">
        <div className="record-card__identity">
          <span className="record-card__label">UUID</span>
          <code className="record-card__id" id={idTitulo}>{registro.id}</code>
        </div>
        <div className={acciones && registro.estado_sync === "pendiente" ? "record-card__actions" : "record-card__status-only"}>
        <span className={`record-status record-status--${registro.estado_sync}`}>
          {ETIQUETAS_ESTADO[registro.estado_sync]}
        </span>
        {acciones && registro.estado_sync === "pendiente" && (
          <>
            <button type="button" className="button--secondary record-card__icon-button"
              aria-label={`Sincronizar registro ${registro.id}`}
              title={acciones.sincronizacionDisponible ? "Sincronizar registro" : "Disponible en la siguiente fase"}
              disabled={acciones.bloqueado || !acciones.sincronizacionDisponible}
              onClick={() => acciones.sincronizar(registro.id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                <path d="M5 17a4 4 0 0 1-1-7 6 6 0 0 1 12-2 5 5 0 0 1 3 9M12 21V11m-4 4 4-4 4 4" />
              </svg>
            </button>
            <button type="button" className="button--secondary record-card__icon-button"
              aria-label={`Eliminar registro local ${registro.id}`} title="Eliminar registro local"
              disabled={acciones.bloqueado} onClick={() => acciones.eliminar(registro.id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
              </svg>
            </button>
          </>
        )}
        </div>
      </header>

      <dl className="record-card__metrics">
        {registro.tipo === "entrenamiento" && (
          <div className="record-card__metric">
            <dt>Participante</dt>
            <dd>{registro.participante_id ?? "Sin participante (captura anterior)"}</dd>
          </div>
        )}
        <div className="record-card__metric">
          <dt>Fecha</dt>
          <dd><time dateTime={registro.fecha}>{formatearFecha(registro.fecha)}</time></dd>
        </div>
        <div className="record-card__metric">
          <dt>Duración</dt>
          <dd>{formatearDuracion(registro.duracion_ms)}</dd>
        </div>
        <div className="record-card__metric">
          <dt>Frecuencia</dt>
          <dd>{formatearFrecuencia(registro.frecuencia_hz)}</dd>
        </div>
        <div className="record-card__metric">
          <dt>Mediciones</dt>
          <dd>{registro.totalMediciones}</dd>
        </div>
        <div className="record-card__metric">
          <dt>Actividad</dt>
          <dd>{actividad}</dd>
        </div>
      </dl>
    </article>
  );
}
