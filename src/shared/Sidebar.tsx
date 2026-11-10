import { useEffect, useRef } from "react";
import { useApiConnectivityTest } from "../hooks/useApiConnectivityTest";
import { useTheme } from "../hooks/useTheme";

type SidebarProps = {
  abierto: boolean;
  onCerrar: () => void;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function Sidebar({ abierto, onCerrar }: SidebarProps) {
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const { estado: estadoTestApi, comprobando, comprobarConexion } = useApiConnectivityTest();
  const { tema, alternarTema } = useTheme();

  useEffect(() => {
    if (!abierto) return;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      const previouslyFocused = previouslyFocusedRef.current;
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onCerrar();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.getClientRects().length > 0);

      if (focusables.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (!first || !last) return;

      if (document.activeElement === panel) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [abierto, onCerrar]);

  return (
    <div
      id="app-sidebar"
      className={`sidebar${abierto ? " sidebar--abierto" : ""}`}
      inert={!abierto}
    >
      <div className="sidebar__backdrop" aria-hidden="true" onClick={onCerrar} />

      <aside
        ref={panelRef}
        className="sidebar__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
        tabIndex={-1}
      >
        <header className="sidebar__header">
          <span className="sidebar__brand-mark" aria-hidden="true">
            <svg className="navigation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
              <path d="M2 12h4l3-7 6 14 3-7h4" />
            </svg>
          </span>
          <strong id="sidebar-title" className="sidebar__brand-title">ML Sensores</strong>
          <button
            ref={closeButtonRef}
            type="button"
            className="sidebar__close"
            onClick={onCerrar}
            aria-label="Cerrar menú"
          >
            <svg className="navigation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="sidebar__content">
          <section className="sidebar__section" aria-labelledby="sidebar-actions-title">
            <h2 id="sidebar-actions-title" className="sidebar__section-title">Herramientas</h2>
            <div className="sidebar__actions">
              <button
                type="button"
                className="sidebar__action"
                onClick={() => {
                  void comprobarConexion();
                }}
                disabled={comprobando}
                aria-busy={comprobando}
                aria-describedby="sidebar-api-note"
              >
                <svg className="navigation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0V7ZM12 16v5" />
                </svg>
                <span>Test API</span>
              </button>
              <button
                type="button"
                className="sidebar__action"
                onClick={alternarTema}
                aria-label={tema === "oscuro" ? "Activar tema claro" : "Activar tema oscuro"}
              >
                <svg className="navigation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  {tema === "oscuro" ? (
                    <>
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" />
                    </>
                  ) : (
                    <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
                  )}
                </svg>
                <span>{tema === "oscuro" ? "Tema claro" : "Tema oscuro"}</span>
              </button>
            </div>
            <p id="sidebar-api-note" className="sidebar__section-note">
              Comprueba manualmente la conexión HTTPS con FastAPI.
            </p>
            {estadoTestApi.estado !== "inicial" && (
              <div
                className={`sidebar__api-result sidebar__api-result--${estadoTestApi.estado}`}
                role={estadoTestApi.estado === "error" ? "alert" : "status"}
                aria-live={estadoTestApi.estado === "error" ? "assertive" : "polite"}
                aria-atomic="true"
                aria-busy={estadoTestApi.estado === "comprobando"}
              >
                {estadoTestApi.estado === "comprobando" && (
                  <>
                    <span className="sidebar__api-spinner" aria-hidden="true" />
                    <p className="sidebar__api-title">Comprobando conexión...</p>
                  </>
                )}
                {estadoTestApi.estado === "exito" && (
                  <>
                    <span className="sidebar__api-icon" aria-hidden="true">
                      <svg className="navigation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    <div className="sidebar__api-copy">
                      <p className="sidebar__api-title">Conexión exitosa</p>
                      <p className="sidebar__api-meta">
                        HTTP {estadoTestApi.codigoHttp} · {estadoTestApi.tiempoMs} ms
                      </p>
                    </div>
                  </>
                )}
                {estadoTestApi.estado === "error" && (
                  <>
                    <span className="sidebar__api-icon" aria-hidden="true">
                      <svg className="navigation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                        <path d="M12 9v4M12 17h.01" />
                        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                      </svg>
                    </span>
                    <div className="sidebar__api-copy">
                      <p className="sidebar__api-title">No se pudo conectar</p>
                      <p className="sidebar__api-meta">
                        {estadoTestApi.codigoHttp !== undefined ? `HTTP ${estadoTestApi.codigoHttp} · ` : ""}
                        {estadoTestApi.tiempoMs} ms
                      </p>
                      <p className="sidebar__api-detail">{estadoTestApi.mensaje}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        </div>

        <footer className="sidebar__footer">
          <p className="sidebar__credit">Desarrollado por José Meza</p>
        </footer>
      </aside>
    </div>
  );
}
