import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../shared/Header";
import BottomNavigation from "../shared/BottomNavigation";
import Sidebar from "../shared/Sidebar";
import { useAndroidBackNavigation } from "../hooks/useAndroidBackNavigation";

export default function AppLayout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const abrirSidebar = useCallback(() => setSidebarAbierto(true), []);
  const cerrarSidebar = useCallback(() => setSidebarAbierto(false), []);
  const manejarAtrasAndroid = useCallback(() => {
    if (!sidebarAbierto) return false;

    cerrarSidebar();
    return true;
  }, [sidebarAbierto, cerrarSidebar]);

  useAndroidBackNavigation(manejarAtrasAndroid);

  return (
    <div className="app-layout">
      <Header onAbrirMenu={abrirSidebar} menuAbierto={sidebarAbierto} />
      <main id="main-content" className="app-content">
        <Outlet />
      </main>
      <div id="app-action-bar" className="app-action-bar" />
      <BottomNavigation />
      <Sidebar abierto={sidebarAbierto} onCerrar={cerrarSidebar} />
    </div>
  );
}
