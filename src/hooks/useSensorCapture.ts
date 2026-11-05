import { useCallback, useEffect, useRef, useState } from "react";
import type { EstadoCaptura, MedicionSensor, ResultadoCaptura } from "../types/sensores";

const DURACION_MS = 10000;
const INTERVALO_MS = 100;

/**
 *! Controla una sesión de captura de 10 segundos por instancia del hook.
 ** El consumidor debe montar una sola instancia para la captura activa.
 * @returns //? Estado, segundos visibles, resultado de la sesión finalizada e iniciar().
 ** Las mediciones completas están en resultado.mediciones; no se guardan en SQLite.
 */
export function useSensorCapture() {
  const [estado, setEstado] = useState<EstadoCaptura>("Listo para iniciar");
  const [segundos, setSegundos] = useState<number>(0);
  const [resultado, setResultado] = useState<ResultadoCaptura | null>(null);

  const medicionesRef = useRef<MedicionSensor[]>([]);
  const inicioRef = useRef<number | null>(null);
  const capturandoRef = useRef<boolean>(false);
  const temporizadorRef = useRef<number | null>(null);
  const listenerRef = useRef<((evento: DeviceMotionEvent) => void) | null>(null);
  const montadoRef = useRef<boolean>(false);

  //TODO: Limpieza idempotente sin actualizaciones de estado. 
  //* El resultado publicado al finalizar conserva su instantánea, independiente del búfer temporal.
  const limpiarRecursos = useCallback((): void => {
    capturandoRef.current = false;
    if (listenerRef.current !== null) {
      window.removeEventListener("devicemotion", listenerRef.current);
      listenerRef.current = null;
    }
    if (temporizadorRef.current !== null) {
      window.clearInterval(temporizadorRef.current);
      temporizadorRef.current = null;
    }
    inicioRef.current = null;
    medicionesRef.current = [];
  }, []);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
      limpiarRecursos();
    };
  }, [limpiarRecursos]);


  function detener(): void {
    if (!capturandoRef.current || inicioRef.current === null) return;

    const mediciones = [...medicionesRef.current];
    const total = mediciones.length;
    const duracionReal = (performance.now() - inicioRef.current) / 1000;
    limpiarRecursos();

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
      mediciones,
    });
    setEstado("Captura finalizada");
    console.log("Mediciones capturadas:", mediciones);
  }


  function iniciar(): void {
    //TODO: Bloquea inicios repetidos antes del siguiente render y llamadas retenidas
    //todo  por otro código después de desmontar esta instancia.
    if (!montadoRef.current || capturandoRef.current) return;

    medicionesRef.current = [];
    inicioRef.current = performance.now();
    capturandoRef.current = true;
    setResultado(null);
    setSegundos(0);
    setEstado("Capturando...");

    //* Solo hay un listener durante la sesión; los renders no lo registran de nuevo.
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

    listenerRef.current = leerSensores;
    window.addEventListener("devicemotion", leerSensores);
    temporizadorRef.current = window.setInterval(() => {
      if (!capturandoRef.current || inicioRef.current === null) return;
      const transcurrido = performance.now() - inicioRef.current;
      setSegundos(Math.min(10, Math.floor(transcurrido / 1000)));
      if (transcurrido >= DURACION_MS) {
        //* Detener automaticamnete al finalizar
        detener();
      }
    }, INTERVALO_MS);
  }

  return { estado, segundos, resultado, iniciar };
}
