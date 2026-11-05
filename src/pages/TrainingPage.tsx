import { NavLink, useMatch } from "react-router-dom";
import CaptureTest from "../components/CaptureTest";

export default function TrainingPage() {
  const sincronizar = useMatch("/entrenamiento/sincronizar") !== null;

  return (
    <>
      <h1>Entrenamiento</h1>
      <nav className="view-navigation" aria-label="Vistas de Entrenamiento">
        <NavLink to="/entrenamiento" end>Captura</NavLink>
        <NavLink to="/entrenamiento/sincronizar" end>Sincronizar</NavLink>
      </nav>
      {sincronizar ? (
        <section aria-labelledby="training-sync-title">
          <h2 id="training-sync-title">Sincronizar entrenamiento</h2>
          <p>Vista provisional. El listado de registros y la sincronización manual se incorporarán en tareas posteriores.</p>
        </section>
      ) : (
        <CaptureTest />
      )}
    </>
  );
}
