import { useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { getPendingRecords, getRecordById, getRecords, initializeDatabase, saveRecord } from "../services/database";
import type { Registro } from "../types/records";

/**
 *! Presenta controles temporales para verificar SQLite con datos sintéticos,
 *! de forma independiente a la captura real de sensores.
 * @returns //? Sección de React con acciones de prueba, resultados y errores visibles.
 */
export default function DatabaseTest() {
  //* El estado deshabilita los controles; la referencia bloquea clics consecutivos
  //* inmediatamente, incluso antes de que React vuelva a renderizar la interfaz.
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [message, setMessage] = useState("Base de datos sin inicializar en esta sesión.");
  const [error, setError] = useState<string | null>(null);
  // Estos datos solo representan lo mostrado en pantalla. La persistencia real
  // reside en SQLite y se comprueba volviendo a consultar después de reabrir la app.
  const [records, setRecords] = useState<Registro[]>([]);
  const [id, setId] = useState("");
  const [selected, setSelected] = useState<Registro | null>(null);

  //TODO: Centraliza la exclusión de acciones simultáneas y los errores de la prueba.
  //* finally libera los controles tanto si la operación termina bien como si falla.
  async function execute(operation: () => Promise<void>): Promise<void> {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await operation();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  //TODO: Permite verificar explícitamente la apertura y repetir la inicialización
  //todo sin crear otra base ni borrar los registros existentes.
  async function initialize(): Promise<void> {
    await initializeDatabase();
    setMessage("Base ml_sensores inicializada.");
  }

  //TODO: Genera una sesión de ejemplo en el dispositivo. Sus valores conocidos sirven
  //todo para comprobar el recorrido escritura/lectura sin depender de los sensores.
  async function saveTest(): Promise<void> {
    if (Capacitor.getPlatform() !== "android") {
      throw new Error("Genera y guarda el registro de prueba desde Android.");
    }
    //* Cada prueba recibe un UUID y fecha nuevos. Las dos muestras son sintéticas;
    //* la duración y frecuencia describen el ejemplo, no una captura física.
    const record: Registro = {
      id: crypto.randomUUID(),
      tipo: "entrenamiento",
      actividad: "quieto",
      fecha: new Date().toISOString(),
      duracion_ms: 10000,
      frecuencia_hz: 0.2,
      mediciones: [
        { tiempo_ms: 0, ax: 0.1, ay: 0.2, az: 0.3, gx: 0.4, gy: 0.5, gz: 0.6 },
        { tiempo_ms: 5000, ax: 1.1, ay: 1.2, az: 1.3, gx: 1.4, gy: 1.5, gz: 1.6 },
      ],
      estado_sync: "pendiente",
    };
    setSelected(null);
    await saveRecord(record);
    setId(record.id);
    setMessage(`Registro guardado: ${record.id}. Verificando lectura…`);
    //* La lectura por UUID y la comparación del JSON verifican la recuperación
    //* inmediata. La persistencia entre ejecuciones requiere además cerrar la app,
    //* reabrirla y consultar este UUID sin volver a guardar el registro.
    const recovered = await getRecordById(record.id);
    if (recovered === null || JSON.stringify(recovered.mediciones) !== JSON.stringify(record.mediciones)) {
      throw new Error("El registro se guardó, pero la verificación de sus mediciones recuperadas falló.");
    }
    setSelected(recovered);
    setRecords(await getRecords());
    setMessage(`Guardado y recuperado por UUID: ${record.id}. JSON verificado.`);
  }

  //TODO: Ambas vistas consultan SQLite de nuevo; el filtro de pendientes no modifica
  //todo los estados ni simula una sincronización con un servidor.
  async function list(pending: boolean): Promise<void> {
    const result = await (pending ? getPendingRecords() : getRecords());
    setRecords(result);
    setMessage(`${result.length} registros ${pending ? "pendientes" : "guardados"}.`);
  }

  //TODO: Permite introducir un UUID anotado antes de cerrar la aplicación. Limpiar
  //todo la selección evita mostrar el resultado anterior si la nueva consulta falla.
  async function findById(): Promise<void> {
    setSelected(null);
    const result = await getRecordById(id.trim());
    setSelected(result);
    setMessage(result ? `Recuperado: ${result.id}` : "No existe un registro con ese UUID.");
  }

  //TODO: La interfaz reúne acciones manuales y mensajes de diagnóstico. La lista
  //todo identifica registros y estados; el detalle JSON permite revisar las muestras
  //todo efectivamente recuperadas de SQLite, no solo el objeto usado al insertarlas.
  return (
    <section style={{ marginTop: "30px" }} aria-labelledby="sqlite-test-title">
      <h2 id="sqlite-test-title">Prueba temporal de SQLite</h2>
      <p>El registro de prueba contiene dos mediciones sintéticas; no procede de los sensores.</p>
      <p role="status">{message}</p>
      {error && <p role="alert">{error}</p>}
      <fieldset disabled={busy}>
        <legend>Almacenamiento local en Android</legend>
        <button onClick={() => void execute(initialize)}>Inicializar base de datos</button>{" "}
        <button onClick={() => void execute(saveTest)}>Guardar registro de prueba</button>{" "}
        <button onClick={() => void execute(() => list(false))}>Consultar registros</button>{" "}
        <button onClick={() => void execute(() => list(true))}>Consultar pendientes</button>
        <p>
          <label htmlFor="record-id">UUID: </label>
          <input id="record-id" value={id} onChange={(event) => setId(event.target.value)} />{" "}
          <button disabled={!id.trim()} onClick={() => void execute(findById)}>Consultar por UUID</button>
        </p>
      </fieldset>
      <ul>
        {records.map((record) => (
          <li key={record.id} style={{ overflowWrap: "anywhere" }}>
            {record.id} — {record.estado_sync} — {record.mediciones.length} mediciones
          </li>
        ))}
      </ul>
      {selected && (
        <div>
          <h3>Registro recuperado de SQLite</h3>
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify(selected, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}
