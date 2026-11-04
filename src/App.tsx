import { useEffect, useRef, useState } from "react";
import DatabaseTest from "./components/DatabaseTest";
import type { EstadoCaptura, MedicionSensor, ResultadoCaptura } from "./types/sensores";

const DURACION_MS = 10000;

function App() {
  const [estado, setEstado] = useState<EstadoCaptura>("Listo para iniciar");
  const [segundos, setSegundos] = useState<number>(0);
  const [resultado, setResultado] = useState<ResultadoCaptura | null>(null);

  const medicionesRef = useRef<MedicionSensor[]>([]);
  const inicioRef = useRef<number | null>(null);
  const capturandoRef = useRef<boolean>(false);
  const temporizadorRef = useRef<number | null>(null);

  useEffect(() => {
    function leerSensores(evento: DeviceMotionEvent): void {
      if (!capturandoRef.current || inicioRef.current === null) return;

      const a = evento.acceleration;
      const g = evento.rotationRate;

      const medicion: MedicionSensor = {
        tiempo_ms: performance.now() - inicioRef.current,
        ax: a?.x ?? null,
        ay: a?.y ?? null,
        az: a?.z ?? null,
        gx: g?.alpha ?? null,
        gy: g?.beta ?? null,
        gz: g?.gamma ?? null,
      };

      medicionesRef.current.push(medicion);
    }

    window.addEventListener("devicemotion", leerSensores);

    return () => {
      window.removeEventListener("devicemotion", leerSensores);
      if (temporizadorRef.current !== null) {
        window.clearInterval(temporizadorRef.current);
      }
    };
  }, []);

  function detener(): void {
    if (!capturandoRef.current || inicioRef.current === null) return;

    capturandoRef.current = false;
    if (temporizadorRef.current !== null) {
      window.clearInterval(temporizadorRef.current);
    }

    const mediciones = medicionesRef.current;
    const total = mediciones.length;

    const duracionReal = (performance.now() - inicioRef.current) / 1000;

    const validas = mediciones.filter((m) =>
      [m.ax, m.ay, m.az, m.gx, m.gy, m.gz].every(
        (valor) => typeof valor === "number" && Number.isFinite(valor)
      )
    ).length;

    const frecuencia = total / duracionReal;

    setSegundos(10);
    setResultado({
      total,
      validas,
      invalidas: total - validas,
      frecuencia: frecuencia.toFixed(2),
      duracion: duracionReal.toFixed(2),
      primera: mediciones[0] ?? null,
      ultima: mediciones[total - 1] ?? null,
    });

    setEstado("Captura finalizada");

    console.log("Mediciones capturadas:", mediciones);
  }

  function iniciar(): void {
    medicionesRef.current = [];
    inicioRef.current = performance.now();
    capturandoRef.current = true;

    setResultado(null);
    setSegundos(0);
    setEstado("Capturando...");

    temporizadorRef.current = window.setInterval(() => {
      if (inicioRef.current === null) return;
      const transcurrido = performance.now() - inicioRef.current;
      setSegundos(Math.min(10, Math.floor(transcurrido / 1000)));

      if (transcurrido >= DURACION_MS) {
        detener();
      }
    }, 100);
  }

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
