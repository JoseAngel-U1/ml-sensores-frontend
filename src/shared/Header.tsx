type HeaderProps = {
  onAbrirMenu: () => void;
  menuAbierto: boolean;
};

export default function Header({ onAbrirMenu, menuAbierto }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <button
          type="button"
          className="app-header__menu"
          onClick={onAbrirMenu}
          aria-label="Abrir menú"
          aria-haspopup="dialog"
          aria-expanded={menuAbierto}
          aria-controls="app-sidebar"
        >
          <svg className="navigation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M2 12h4l3-7 6 14 3-7h4" />
          </svg>
        </button>
        <strong className="app-header__title">ML Sensores</strong>
      </div>
    </header>
  );
}
