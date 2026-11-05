import DatabaseTest from "./components/DatabaseTest";
import { useSensorCapture } from "./hooks/useSensorCapture";

function App() {
  const { estado, segundos, resultado, iniciar } = useSensorCapture();

  return (
    <main style={{
      background: "#101827",
      color: "white",
      minHeight: "100vh",
      padding: "24px",
      fontFamily: "Arial",
    }}>
      <h1>Prueba de captura</h1>

      <p>Estado: {estado}</p>
      <p>Tiempo: {segundos} / 10 segundos</p>

      <button
        onClick={iniciar}
        disabled={estado === "Capturando..."}
        style={{
          padding: "14px 24px",
          fontSize: "18px",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Iniciar captura
      </button>

      {resultado && (
        <section style={{ marginTop: "30px" }}>
          <h2>Resultados</h2>
          <p>Duración: {resultado.duracion} s</p>
          <p>Total de mediciones: {resultado.total}</p>
          <p>Mediciones válidas: {resultado.validas}</p>
          <p>Mediciones incompletas: {resultado.invalidas}</p>
          <p>Frecuencia promedio: {resultado.frecuencia} Hz</p>

          <h3>Primera medición</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(resultado.primera, null, 2)}
          </pre>

          <h3>Última medición</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(resultado.ultima, null, 2)}
          </pre>
        </section>
      )}
      <DatabaseTest />
    </main>
  );
}

export default App;
