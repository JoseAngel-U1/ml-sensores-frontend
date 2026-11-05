import { NavLink } from "react-router-dom";

export default function BottomNavigation() {
  return (
    <nav className="bottom-navigation" aria-label="Módulos principales">
      {/* Sin end: el módulo permanece activo también en su vista Sincronizar. */}
      <NavLink to="/entrenamiento">Entrenamiento</NavLink>
      <NavLink to="/prediccion">Predicción</NavLink>
    </nav>
  );
}
