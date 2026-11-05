import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import TrainingPage from "./pages/TrainingPage";
import PredictionPage from "./pages/PredictionPage";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/entrenamiento" replace />} />
        <Route path="/entrenamiento" element={<TrainingPage />} />
        <Route path="/entrenamiento/sincronizar" element={<TrainingPage />} />
        <Route path="/prediccion" element={<PredictionPage />} />
        <Route path="/prediccion/sincronizar" element={<PredictionPage />} />
        <Route path="*" element={<Navigate to="/entrenamiento" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
