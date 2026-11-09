import type { Actividad, EstadoSync, RegistroResumen } from "../../types/records";

interface RecordCardProps {
  registro: RegistroResumen;
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

export default function RecordCard({ registro }: RecordCardProps) {
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
        <span className={`record-status record-status--${registro.estado_sync}`}>
          {ETIQUETAS_ESTADO[registro.estado_sync]}
        </span>
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
