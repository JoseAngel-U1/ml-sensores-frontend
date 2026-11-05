export default function Header() {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <span className="app-header__mark" aria-hidden="true">
          <svg className="navigation-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
            <path d="M2 12h4l3-7 6 14 3-7h4" />
          </svg>
        </span>
        <strong className="app-header__title">ML Sensores</strong>
      </div>
    </header>
  );
}
