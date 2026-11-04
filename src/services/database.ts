import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite, SQLiteConnection } from "@capacitor-community/sqlite";
import type { SQLiteDBConnection } from "@capacitor-community/sqlite";
import type { Medicion, Registro } from "../types/records";

const DATABASE_NAME = "ml_sensores";
const sqlite = new SQLiteConnection(CapacitorSQLite);
let initialization: Promise<SQLiteDBConnection> | null = null;
let operations: Promise<unknown> = Promise.resolve();

const SCHEMA = `
CREATE TABLE IF NOT EXISTS registros (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL
        CHECK (tipo IN ('entrenamiento', 'prediccion')),
    actividad TEXT
        CHECK (
            actividad IS NULL OR
            actividad IN ('quieto', 'caminando', 'corriendo')
        ),
    fecha TEXT NOT NULL,
    duracion_ms REAL NOT NULL CHECK (duracion_ms > 0),
    frecuencia_hz REAL NOT NULL CHECK (frecuencia_hz > 0),
    mediciones TEXT NOT NULL,
    estado_sync TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (estado_sync IN ('pendiente', 'sincronizado')),
    CHECK (
        (tipo = 'entrenamiento' AND actividad IS NOT NULL)
        OR
        (tipo = 'prediccion' AND actividad IS NULL)
    )
);
CREATE INDEX IF NOT EXISTS idx_registros_estado
ON registros (estado_sync);
`;

function contextualError(message: string, cause: unknown): Error {
  const detail = cause instanceof Error ? cause.message : String(cause);
  return new Error(`${message}: ${detail}`, { cause });
}

async function openDatabase(): Promise<SQLiteDBConnection> {
  if (Capacitor.getPlatform() !== "android") {
    throw new Error("Esta integración SQLite requiere ejecutar la aplicación en Android.");
  }
  if (!Capacitor.isPluginAvailable("CapacitorSQLite")) {
    throw new Error("SQLite no está disponible. Sincroniza Capacitor y recompila la aplicación Android.");
  }

  // Reconcilia conexiones nativas, incluso después de recargar el WebView.
  await sqlite.checkConnectionsConsistency();
  const exists = await sqlite.isConnection(DATABASE_NAME, false);
  const db = exists.result
    ? await sqlite.retrieveConnection(DATABASE_NAME, false)
    : await sqlite.createConnection(DATABASE_NAME, false, "no-encryption", 1, false);

  if (!(await db.isDBOpen()).result) await db.open();
  await db.execute(SCHEMA);
  return db;
}

function getDatabase(): Promise<SQLiteDBConnection> {
  if (initialization === null) {
    initialization = openDatabase().catch((cause: unknown) => {
      // Permite reintentar; la conexión existente se recupera en el siguiente intento.
      initialization = null;
      throw contextualError("No se pudo inicializar ml_sensores", cause);
    });
  }
  return initialization;
}

export async function initializeDatabase(): Promise<void> {
  await getDatabase();
}

// Evita transacciones superpuestas si varios consumidores utilizan el servicio.
function withDatabase<T>(message: string, operation: (db: SQLiteDBConnection) => Promise<T>): Promise<T> {
  const result = operations.then(async () => {
    try {
      return await operation(await getDatabase());
    } catch (cause: unknown) {
      throw contextualError(message, cause);
    }
  });
  operations = result.catch(() => undefined);
  return result;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isMeasurement(value: unknown): value is Medicion {
  return isObject(value)
    && isFiniteNumber(value.tiempo_ms) && value.tiempo_ms >= 0
    && [value.ax, value.ay, value.az, value.gx, value.gy, value.gz].every(isFiniteNumber);
}

function validateRecord(value: unknown): asserts value is Registro {
  if (!isObject(value)) throw new Error("El registro no es un objeto válido.");
  if (typeof value.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.id)) {
    throw new Error("El identificador debe ser un UUID.");
  }
  const validActivity = value.actividad === "quieto" || value.actividad === "caminando" || value.actividad === "corriendo";
  if (!((value.tipo === "entrenamiento" && validActivity)
    || (value.tipo === "prediccion" && value.actividad === null))) {
    throw new Error("Un entrenamiento requiere actividad; una predicción requiere actividad nula.");
  }
  // Formato ISO 8601 UTC canónico generado por Date.toISOString().
  if (typeof value.fecha !== "string" || !Number.isFinite(Date.parse(value.fecha))
    || new Date(value.fecha).toISOString() !== value.fecha) {
    throw new Error("La fecha debe estar en formato ISO 8601 UTC (Date.toISOString()).");
  }
  if (!isFiniteNumber(value.duracion_ms) || value.duracion_ms <= 0
    || !isFiniteNumber(value.frecuencia_hz) || value.frecuencia_hz <= 0) {
    throw new Error("La duración y frecuencia deben ser números finitos positivos.");
  }
  if (!Array.isArray(value.mediciones) || value.mediciones.length === 0
    || !Array.from(value.mediciones).every(isMeasurement)) {
    throw new Error("Se requiere al menos una medición con tiempo válido y seis lecturas numéricas finitas.");
  }
  if (value.estado_sync !== "pendiente" && value.estado_sync !== "sincronizado") {
    throw new Error("Estado de sincronización inválido.");
  }
}

function decodeRecord(row: unknown): Registro {
  if (!isObject(row) || typeof row.mediciones !== "string") {
    throw new Error("Fila SQLite inválida: mediciones debe contener JSON.");
  }
  const mediciones: unknown = JSON.parse(row.mediciones);
  const record: unknown = { ...row, mediciones };
  validateRecord(record);
  return record;
}

export async function saveRecord(registro: Registro): Promise<void> {
  // Validar y serializar antes de encolar crea una instantánea de los datos.
  let values: (string | number | null)[];
  try {
    validateRecord(registro);
    if (registro.estado_sync !== "pendiente") {
      throw new Error("Todo registro nuevo debe comenzar pendiente.");
    }
    values = [registro.id, registro.tipo, registro.actividad, registro.fecha,
      registro.duracion_ms, registro.frecuencia_hz, JSON.stringify(registro.mediciones), "pendiente"];
  } catch (cause: unknown) {
    throw contextualError("No se pudo validar el registro para guardarlo", cause);
  }
  await withDatabase("No se pudo guardar el registro", async (db) => {
    // INSERT normal: un UUID duplicado produce error, nunca sobrescribe datos.
    await db.run(`INSERT INTO registros
      (id, tipo, actividad, fecha, duracion_ms, frecuencia_hz, mediciones, estado_sync)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, values);
  });
}

function queryRecords(statement: string, values: string[] = []): Promise<Registro[]> {
  return withDatabase("No se pudieron consultar los registros", async (db) => {
    const result = await db.query(statement, values);
    const rows: unknown = result.values;
    if (!Array.isArray(rows)) throw new Error("SQLite no devolvió una lista de filas.");
    return rows.map((row: unknown) => decodeRecord(row));
  });
}

export function getRecords(): Promise<Registro[]> {
  return queryRecords("SELECT * FROM registros ORDER BY fecha DESC, id ASC");
}

export function getPendingRecords(): Promise<Registro[]> {
  return queryRecords("SELECT * FROM registros WHERE estado_sync = ? ORDER BY fecha DESC, id ASC", ["pendiente"]);
}

export async function getRecordById(id: string): Promise<Registro | null> {
  const records = await queryRecords("SELECT * FROM registros WHERE id = ?", [id]);
  return records[0] ?? null;
}

export async function markAsSynced(id: string): Promise<void> {
  await withDatabase("No se pudo marcar el registro como sincronizado", async (db) => {
    const result = await db.run("UPDATE registros SET estado_sync = ? WHERE id = ?", ["sincronizado", id]);
    if (result.changes?.changes !== 1) throw new Error(`No existe el registro ${id}.`);
  });
}
