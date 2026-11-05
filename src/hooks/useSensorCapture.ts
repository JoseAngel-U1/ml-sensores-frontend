import { useCallback, useEffect, useRef, useState } from "react";
import type { EstadoCaptura, MedicionSensor, ResultadoCaptura } from "../types/sensores";

export const DURACION_CAPTURA_SEGUNDOS = 10;
export const DURACION_PREPARACION_SEGUNDOS = 3;

const DURACION_MS = DURACION_CAPTURA_SEGUNDOS * 1000;
const DURACION_PREPARACION_MS = DURACION_PREPARACION_SEGUNDOS * 1000;
const INTERVALO_MS = 100;

/**
 *! Controla una preparación de 3 segundos y una captura posterior de 10 segundos
 ** por instancia del hook. El consumidor debe montar una sola instancia activa.
 * @returns //? Estado, segundos de preparación, segundos de captura, resultado e iniciar().
 ** Las mediciones completas están en resultado.mediciones; no se guardan en SQLite.
 */
export function useSensorCapture() {
  const [estado, setEstado] = useState<EstadoCaptura>("Listo para iniciar");
  const [preparacion, setPreparacion] = useState<number>(0);
  const [segundos, setSegundos] = useState<number>(0);
  const [resultado, setResultado] = useState<ResultadoCaptura | null>(null);

  const medicionesRef = useRef<MedicionSensor[]>([]);
  const inicioRef = useRef<number | null>(null);
  const preparandoRef = useRef<boolean>(false);
  const preparacionInicioRef = useRef<number | null>(null);
  const preparacionTimerRef = useRef<number | null>(null);
  const capturandoRef = useRef<boolean>(false);
  const temporizadorRef = useRef<number | null>(null);
  const listenerRef = useRef<((evento: DeviceMotionEvent) => void) | null>(null);
  const montadoRef = useRef<boolean>(false);

  //TODO: Limpieza idempotente sin actualizaciones de estado.
  //* Cancela preparación y captura, retira listener/intervalos y descarta el búfer.
  //* El resultado publicado al finalizar conserva su instantánea, independiente del búfer temporal.
  const limpiarRecursos = useCallback((): void => {
    preparandoRef.current = false;
    if (preparacionTimerRef.current !== null) {
      window.clearInterval(preparacionTimerRef.current);
      preparacionTimerRef.current = null;
    }
    preparacionInicioRef.current = null;

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

    setPreparacion(0);
    setSegundos(DURACION_CAPTURA_SEGUNDOS);
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


  function comenzarCaptura(): void {
    //* La preparación pudo cancelarse por desmontaje antes de este punto.
    if (!montadoRef.current || !preparandoRef.current) return;

    preparandoRef.current = false;
    preparacionInicioRef.current = null;
    if (preparacionTimerRef.current !== null) {
      window.clearInterval(preparacionTimerRef.current);
      preparacionTimerRef.current = null;
    }

    setPreparacion(0);
    medicionesRef.current = [];
    inicioRef.current = performance.now();
    capturandoRef.current = true;
    setSegundos(0);
    setEstado("Capturando...");

    //* El listener se registra solo al terminar la preparación; durante esos
    //todo 3 segundos no se recibe ni se almacena ninguna medición.
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
      if (!montadoRef.current || !capturandoRef.current || inicioRef.current === null) return;
      const transcurrido = performance.now() - inicioRef.current;
      setSegundos(Math.min(DURACION_CAPTURA_SEGUNDOS, Math.floor(transcurrido / 1000)));
      if (transcurrido >= DURACION_MS) {
        //* Detener automáticamente al finalizar
        detener();
      }
    }, INTERVALO_MS);
  }


  function iniciar(): void {
    //TODO: Bloquea inicios repetidos durante preparación o captura, antes del
    //todo siguiente render, y llamadas retenidas después de desmontar esta instancia.
    if (!montadoRef.current || preparandoRef.current || capturandoRef.current) return;

    medicionesRef.current = [];
    inicioRef.current = null;
    preparandoRef.current = true;
    preparacionInicioRef.current = performance.now();
    setResultado(null);
    setSegundos(0);
    setPreparacion(DURACION_PREPARACION_SEGUNDOS);
    setEstado("Preparando...");

    //* Solo cuenta el tiempo de preparación: no hay listener de sensores todavía.
    preparacionTimerRef.current = window.setInterval(() => {
      if (!montadoRef.current || !preparandoRef.current || preparacionInicioRef.current === null) return;
      const transcurrido = performance.now() - preparacionInicioRef.current;
      const restante = Math.max(
        0,
        Math.ceil((DURACION_PREPARACION_MS - transcurrido) / 1000)
      );
      setPreparacion(restante);
      if (transcurrido >= DURACION_PREPARACION_MS) {
        comenzarCaptura();
      }
    }, INTERVALO_MS);
  }

  return { estado, preparacion, segundos, resultado, iniciar };
}
