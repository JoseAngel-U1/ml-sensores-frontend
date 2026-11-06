import { useId } from "react";
import RecordList from "./RecordList";
import { useRecordSummaries } from "../../hooks/useRecordSummaries";
import type { TipoRegistro } from "../../types/records";

interface RecordsSyncViewProps {
  tipo: TipoRegistro;
}

interface TextosVista {
  titulo: string;
  descripcion: string;
  vacio: string;
}

const TEXTOS: Record<TipoRegistro, TextosVista> = {
  entrenamiento: {
    titulo: "Registros de entrenamiento",
    descripcion: "Capturas guardadas localmente con su actividad. La sincronización con el servidor se habilitará en la Fase 4.",
    vacio: "No hay registros de entrenamiento guardados localmente.",
  },
  prediccion: {
    titulo: "Registros de predicción",
    descripcion: "Capturas guardadas localmente sin etiqueta de actividad. La sincronización con el servidor se habilitará en la Fase 4.",
    vacio: "No hay registros de predicción guardados localmente.",
  },
};

function textoCantidad(cantidad: number): string {
  return cantidad === 1 ? "1 registro" : `${cantidad} registros`;
}

export default function RecordsSyncView({ tipo }: RecordsSyncViewProps) {
  const { registros, cargando, error, actualizar } = useRecordSummaries(tipo);
  const tituloId = useId();
  const textos = TEXTOS[tipo];
  const estadoInicial = cargando && registros.length === 0;
  const vacio = !cargando && error === null && registros.length === 0;
  const mostrarCantidad = error === null || registros.length > 0;

  return (
    <section className="records-sync" aria-labelledby={tituloId}>
      <header className="records-sync__header">
        <div className="records-sync__heading">
          <h2 id={tituloId}>{textos.titulo}</h2>
          <p className="text-secondary">{textos.descripcion}</p>
        </div>
      </header>

      {mostrarCantidad && (
        <p className="records-sync__summary" role="status" aria-live="polite">
          {estadoInicial ? "Consultando registros locales…" : textoCantidad(registros.length)}
        </p>
      )}

      {error && (
        <div className="records-sync__error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="button--secondary"
            onClick={actualizar}
            disabled={cargando}
          >
            Reintentar
          </button>
        </div>
      )}

      {vacio && <p className="records-sync__state">{textos.vacio}</p>}

      {registros.length > 0 && <RecordList registros={registros} />}
    </section>
  );
}
