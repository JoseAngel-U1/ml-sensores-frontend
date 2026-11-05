import DatabaseTest from "./DatabaseTest";
import { useSensorCapture } from "../hooks/useSensorCapture";

// Prueba temporal conservada como único consumidor del hook de captura.
function CaptureTest() {
  const { estado, segundos, resultado, iniciar } = useSensorCapture();

  return (
    <section aria-labelledby="capture-test-title">
      <h2 id="capture-test-title">Prueba de captura</h2>
      <p>Al cambiar de vista se descarta esta prueba de captura, sin guardar sus mediciones.</p>

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
          <h3>Resultados</h3>
          <p>Duración: {resultado.duracion} s</p>
          <p>Total de mediciones: {resultado.total}</p>
          <p>Mediciones válidas: {resultado.validas}</p>
          <p>Mediciones incompletas: {resultado.invalidas}</p>
          <p>Frecuencia promedio: {resultado.frecuencia} Hz</p>

          <h4>Primera medición</h4>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(resultado.primera, null, 2)}
          </pre>

          <h4>Última medición</h4>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(resultado.ultima, null, 2)}
          </pre>
        </section>
      )}
      <DatabaseTest />
    </section>
  );
}

export default CaptureTest;
