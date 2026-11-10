import { Outlet } from "react-router-dom";
import Header from "../shared/Header";
import BottomNavigation from "../shared/BottomNavigation";
import { useAndroidBackNavigation } from "../hooks/useAndroidBackNavigation";

export default function AppLayout() {
  useAndroidBackNavigation();

  return (
    <div className="app-layout">
      <Header />
      <main id="main-content" className="app-content">
        <Outlet />
      </main>
      <div id="app-action-bar" className="app-action-bar" />
      <BottomNavigation />
    </div>
  );
}
