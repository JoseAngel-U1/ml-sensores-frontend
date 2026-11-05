import { NavLink } from "react-router-dom";

export default function BottomNavigation() {
  return (
    <nav className="bottom-navigation" aria-label="Módulos principales">
      <div className="bottom-navigation__inner">
        {/* Sin end: el módulo permanece activo también en su vista Sincronizar. */}
        <NavLink to="/entrenamiento">
          <svg className="navigation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M4 9a8 8 0 0 1 14-3l2 3M20 15a8 8 0 0 1-14 3l-2-3M20 4v5h-5M4 20v-5h5" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          <span>Entrenamiento</span>
        </NavLink>
        <NavLink to="/prediccion">
          <svg className="navigation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <circle cx="6" cy="6" r="2" />
            <circle cx="18" cy="6" r="2" />
            <circle cx="12" cy="18" r="2" />
            <path d="M8 6h8M7 8l4 8M17 8l-4 8" />
          </svg>
          <span>Predicción</span>
        </NavLink>
      </div>
    </nav>
  );
}
