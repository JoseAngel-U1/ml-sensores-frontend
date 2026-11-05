import { NavLink, useMatch } from "react-router-dom";

export default function PredictionPage() {
  const sincronizar = useMatch("/prediccion/sincronizar") !== null;

  return (
    <>
      <h1>Predicción</h1>
      <nav className="view-navigation" aria-label="Vistas de Predicción">
        <NavLink to="/prediccion" end>Captura</NavLink>
        <NavLink to="/prediccion/sincronizar" end>Sincronizar</NavLink>
      </nav>
      <section className="surface-card" aria-labelledby="prediction-view-title">
        <h2 id="prediction-view-title">{sincronizar ? "Sincronizar predicción" : "Captura para predicción"}</h2>
        <p className="text-secondary">
          {sincronizar
            ? "Vista provisional. El listado de registros y la sincronización manual se incorporarán en tareas posteriores."
            : "Vista provisional. La captura para predicción se incorporará en una tarea posterior. La prueba funcional está disponible en Captura de Entrenamiento."}
        </p>
      </section>
    </>
  );
}
