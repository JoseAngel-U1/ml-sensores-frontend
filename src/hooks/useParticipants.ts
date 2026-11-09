import { useCallback, useEffect, useRef, useState } from "react";
import { createParticipant, deleteParticipant, getNextParticipantCode, getParticipants } from "../services/database";
import type { Participante } from "../types/records";

export function useParticipants() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [seleccionado, setSeleccionado] = useState("");
  const [ocupado, setOcupado] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const operacionRef = useRef(false);
  const montadoRef = useRef(false);

  const ejecutar = useCallback(async (operacion: () => Promise<void>): Promise<void> => {
    if (operacionRef.current || !montadoRef.current) return;
    operacionRef.current = true;
    setOcupado(true);
    setError(null);
    setMensaje(null);
    try {
      await operacion();
    } catch (cause: unknown) {
      if (montadoRef.current) setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      operacionRef.current = false;
      if (montadoRef.current) setOcupado(false);
    }
  }, []);

  const cargar = useCallback(async (): Promise<void> => {
    const lista = await getParticipants();
    if (!montadoRef.current) return;
    setParticipantes(lista);
    setSeleccionado((actual) => lista.some((p) => p.codigo === actual) ? actual : lista[0]?.codigo ?? "");
  }, []);

  useEffect(() => {
    montadoRef.current = true;
    queueMicrotask(() => { void ejecutar(cargar); });
    return () => { montadoRef.current = false; };
  }, [cargar, ejecutar]);

  function agregar(): void {
    void ejecutar(async () => {
      const previsto = await getNextParticipantCode();
      if (!montadoRef.current || !window.confirm(
        `¿Agregar el participante ${previsto}? Es el próximo código previsto; el definitivo se asignará al guardar.`
      )) return;
      const nuevo = await createParticipant();
      if (!montadoRef.current) return;
      setParticipantes((actuales) => [...actuales, nuevo]);
      setSeleccionado(nuevo.codigo);
      setMensaje(`Participante ${nuevo.codigo} creado.`);
    });
  }

  function eliminar(): void {
    const codigo = seleccionado;
    if (!codigo) return;
    void ejecutar(async () => {
      if (!window.confirm(`¿Eliminar ${codigo}? Solo puede eliminarse si no tiene capturas asociadas. Su código no se reutilizará.`)) return;
      await deleteParticipant(codigo);
      if (!montadoRef.current) return;
      setParticipantes((actuales) => actuales.filter((p) => p.codigo !== codigo));
      setSeleccionado("");
      setMensaje(`Participante ${codigo} eliminado. Su código no se reutilizará.`);
    });
  }

  const hayOperacionEnCurso = useCallback((): boolean => operacionRef.current, []);

  return {
    participantes, seleccionado, setSeleccionado, ocupado, error, mensaje,
    agregar, eliminar, actualizar: () => { void ejecutar(cargar); }, hayOperacionEnCurso,
  };
}
