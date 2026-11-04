import { useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { getPendingRecords, getRecordById, getRecords, initializeDatabase, saveRecord } from "../services/database";
import type { Registro } from "../types/records";

export default function DatabaseTest() {
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [message, setMessage] = useState("Base de datos sin inicializar en esta sesión.");
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<Registro[]>([]);
  const [id, setId] = useState("");
  const [selected, setSelected] = useState<Registro | null>(null);

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

  async function initialize(): Promise<void> {
    await initializeDatabase();
    setMessage("Base ml_sensores inicializada.");
  }

  async function saveTest(): Promise<void> {
    if (Capacitor.getPlatform() !== "android") {
      throw new Error("Genera y guarda el registro de prueba desde Android.");
    }
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
    const recovered = await getRecordById(record.id);
    if (recovered === null || JSON.stringify(recovered.mediciones) !== JSON.stringify(record.mediciones)) {
      throw new Error("El registro se guardó, pero la verificación de sus mediciones recuperadas falló.");
    }
    setSelected(recovered);
    setRecords(await getRecords());
    setMessage(`Guardado y recuperado por UUID: ${record.id}. JSON verificado.`);
  }

  async function list(pending: boolean): Promise<void> {
    const result = await (pending ? getPendingRecords() : getRecords());
    setRecords(result);
    setMessage(`${result.length} registros ${pending ? "pendientes" : "guardados"}.`);
  }

  async function findById(): Promise<void> {
    setSelected(null);
    const result = await getRecordById(id.trim());
    setSelected(result);
    setMessage(result ? `Recuperado: ${result.id}` : "No existe un registro con ese UUID.");
  }

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
