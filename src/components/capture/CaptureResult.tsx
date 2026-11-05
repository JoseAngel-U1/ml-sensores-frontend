import type { ResultadoCaptura } from "../../types/sensores";

interface CaptureResultProps {
  resultado: ResultadoCaptura;
}

/**
 *! Resume las métricas de una sesión finalizada y conserva el detalle de las
 ** mediciones en memoria. No guarda registros ni consulta SQLite.
 */
export default function CaptureResult({ resultado }: CaptureResultProps) {
  return (
    <section className="surface-card capture-result" aria-labelledby="capture-result-title">
      <h2 id="capture-result-title">Resultado de la captura</h2>
      <dl className="capture-result__metrics">
        <div className="capture-result__metric">
          <dt>Duración</dt>
          <dd>{resultado.duracion} s</dd>
        </div>
        <div className="capture-result__metric">
          <dt>Frecuencia</dt>
          <dd>{resultado.frecuencia} Hz</dd>
        </div>
        <div className="capture-result__metric">
          <dt>Mediciones</dt>
          <dd>{resultado.total}</dd>
        </div>
        <div className="capture-result__metric">
          <dt>Válidas</dt>
          <dd>{resultado.validas}</dd>
        </div>
        <div className="capture-result__metric">
          <dt>Incompletas</dt>
          <dd>{resultado.invalidas}</dd>
        </div>
      </dl>
      <p className="text-secondary">
        Se conservan {resultado.mediciones.length} mediciones completas e incompletas en memoria.
        Todavía no se guardan en SQLite.
      </p>
      <details className="capture-result__details">
        <summary>Primera y última medición</summary>
        <h3>Primera medición</h3>
        <pre>{JSON.stringify(resultado.primera, null, 2)}</pre>
        <h3>Última medición</h3>
        <pre>{JSON.stringify(resultado.ultima, null, 2)}</pre>
      </details>
    </section>
  );
}
