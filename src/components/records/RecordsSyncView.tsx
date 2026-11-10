import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import RecordList from "./RecordList";
import { useRecordSummaries } from "../../hooks/useRecordSummaries";
import { useRecordSync } from "../../hooks/useRecordSync";
import type { ResumenSincronizacion } from "../../services/sync";
import type { TipoRegistro } from "../../types/records";

interface RecordsSyncViewProps {
  tipo: TipoRegistro;
}

interface TextosVista {
  titulo: string;
  descripcion: string;
  vacio: string;
  disponible: boolean;
  nota: string | null;
}

const TEXTOS: Record<TipoRegistro, TextosVista> = {
  entrenamiento: {
    titulo: "Entrenamientos pendientes",
    descripcion: "Capturas de entrenamiento guardadas localmente que todavía no se han enviado. Solo se muestran los registros pendientes.",
    vacio: "No hay entrenamientos pendientes de sincronizar.",
    disponible: true,
    nota: null,
  },
  prediccion: {
    titulo: "Predicciones pendientes",
    descripcion: "Capturas sin etiqueta guardadas localmente que todavía no se han enviado al servidor. Solo se muestran los registros pendientes.",
    vacio: "No hay predicciones pendientes de sincronizar.",
    disponible: true,
    nota: null,
  },
};

function textoPendientes(cantidad: number): string {
  return cantidad === 1 ? "1 pendiente en este módulo" : `${cantidad} pendientes en este módulo`;
}

function textoSincronizar(
  cantidad: number,
  sincronizando: boolean,
  disponible: boolean,
  cargando: boolean,
  hayError: boolean,
): string {
  if (!disponible) return "Sincronización disponible en la siguiente fase";
  if (sincronizando) return "Sincronizando…";
  if (cargando) return "Consultando pendientes…";
  if (hayError) return "No se pueden determinar los pendientes";
  if (cantidad === 0) return "Sin pendientes para sincronizar";
  return cantidad === 1 ? "Sincronizar 1 pendiente" : `Sincronizar ${cantidad} pendientes`;
}

function ResumenEnvio({ resumen, restantes }: { resumen: ResumenSincronizacion; restantes: number | null }) {

  return (
    <section className="records-sync__result" aria-label="Resultado de la sincronización">
      <h3>Resultado del envío</h3>
      <dl className="records-sync__result-metrics">
        <div>
          <dt>Confirmados por el servidor</dt>
          <dd>{resumen.confirmados}</dd>
        </div>
        <div>
          <dt>Guardados</dt>
          <dd>{resumen.guardados}</dd>
        </div>
        <div>
          <dt>Ya existentes</dt>
          <dd>{resumen.existentes}</dd>
        </div>
        <div>
          <dt>Fallidos</dt>
          <dd>{resumen.fallidos}</dd>
        </div>
        <div>
          <dt>Omitidos localmente</dt>
          <dd>{resumen.omitidos.length}</dd>
        </div>
        <div>
          <dt>Pendientes restantes</dt>
          <dd>{restantes ?? "Consultando SQLite…"}</dd>
        </div>
      </dl>
      {resumen.omitidos.length > 0 && (
        <p className="records-sync__note">
          Hay registros con datos locales incompletos que no se enviaron y siguen pendientes.
        </p>
      )}
      {resumen.tipo === "entrenamiento" && resumen.omitidos.length > 0 && (
        <details className="records-sync__note">
          <summary>Ver motivos de los entrenamientos no enviados</summary>
          <ul>
            {resumen.omitidos.map((omitido) => (
              <li key={omitido.id}>
                <code>{omitido.id}</code>: {omitido.motivo}
              </li>
            ))}
          </ul>
        </details>
      )}
      {resumen.erroresMarcado.length > 0 && (
        <p className="records-sync__warning" role="alert">
          {resumen.erroresMarcado.length === 1
            ? "Un registro confirmado por el servidor no se pudo marcar en SQLite; sigue pendiente localmente."
            : `${resumen.erroresMarcado.length} registros confirmados por el servidor no se pudieron marcar en SQLite; siguen pendientes localmente.`}
        </p>
      )}
      {resumen.errores.length > 0 && (
        <p className="records-sync__warning" role="alert">
          El envío se detuvo: {resumen.errores.join(" ")}
        </p>
      )}
    </section>
  );
}

export default function RecordsSyncView({ tipo }: RecordsSyncViewProps) {
  const { registros, cargando, error, actualizar } = useRecordSummaries(tipo);
  const {
    sincronizando,
    ocupado,
    resumen,
    error: errorSync,
    sincronizar,
    eliminar,
  } = useRecordSync({ tipo, onFinalizado: actualizar });
  const tituloId = useId();
  const [contenedorAccion, setContenedorAccion] = useState<HTMLElement | null>(null);
  const textos = TEXTOS[tipo];
  const pendientes = registros.filter((registro) => registro.tipo === tipo && registro.estado_sync === "pendiente");
  const vacio = !cargando && error === null && pendientes.length === 0;
  const puedeSincronizar = textos.disponible && !cargando && error === null
    && !ocupado && !sincronizando && pendientes.length > 0;

  const vincularContenedorAccion = useCallback((): void => {
    setContenedorAccion(document.getElementById("app-action-bar"));
  }, []);

  useEffect(() => {
    let activo = true;
    queueMicrotask(() => {
      if (activo) vincularContenedorAccion();
    });
    return () => {
      activo = false;
    };
  }, [vincularContenedorAccion]);

  function manejarSincronizacion(): void {
    if (!puedeSincronizar) return;
    void sincronizar();
  }

  const barraAccion = contenedorAccion === null
    ? null
    : createPortal(
      <footer className="records-sync__action">
        {sincronizando && (
          <p className="records-sync__action-status" role="status" aria-live="polite">
            Procesando registros pendientes…
          </p>
        )}
        {textos.nota && <p className="records-sync__action-note">{textos.nota}</p>}
        <button
          type="button"
          className="records-sync__action-button"
          onClick={manejarSincronizacion}
          disabled={!puedeSincronizar}
          aria-busy={sincronizando}
        >
          {textoSincronizar(pendientes.length, sincronizando, textos.disponible, cargando, error !== null)}
        </button>
      </footer>,
      contenedorAccion,
    );

  return (
    <>
      <section className="records-sync" aria-labelledby={tituloId} aria-busy={sincronizando}>
        <header className="records-sync__header">
          <div className="records-sync__heading">
            <h2 id={tituloId}>{textos.titulo}</h2>
            <p className="text-secondary">{textos.descripcion}</p>
          </div>
        </header>

        {error === null && (
          <p className="records-sync__summary" role="status" aria-live="polite">
            {cargando ? "Consultando registros pendientes…" : textoPendientes(pendientes.length)}
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

        {errorSync && (
          <div className="records-sync__error" role="alert">
            <p>{errorSync}</p>
            <p>Actualiza el listado o reintenta la operación cuando esté disponible.</p>
          </div>
        )}

        {resumen && <ResumenEnvio resumen={resumen} restantes={cargando || error !== null ? null : pendientes.length} />}

        {vacio && <p className="records-sync__state">{textos.vacio}</p>}

        {ocupado && !sincronizando && <p role="status">Hay una operación de registros en curso…</p>}
        {pendientes.length > 0 && <RecordList registros={pendientes} acciones={{
          bloqueado: ocupado || sincronizando || cargando || error !== null,
          sincronizacionDisponible: textos.disponible,
          sincronizar: (id) => { if (puedeSincronizar) void sincronizar(id); },
          eliminar: (id) => { if (!ocupado && !cargando && error === null) void eliminar(id); },
        }} />}
      </section>
      {barraAccion}
    </>
  );
}
