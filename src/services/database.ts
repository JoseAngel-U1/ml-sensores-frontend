import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite, SQLiteConnection } from "@capacitor-community/sqlite";
import type { SQLiteDBConnection } from "@capacitor-community/sqlite";
import type { Medicion, Registro } from "../types/records";

// El gestor del plugin se comparte entre los consumidores de este módulo.
// La base reside en el almacenamiento privado de Android, no en el estado de React.
const DATABASE_NAME = "ml_sensores";
const sqlite = new SQLiteConnection(CapacitorSQLite);
// Conserva tanto la apertura en curso como su resultado para compartir la conexión.
let initialization: Promise<SQLiteDBConnection> | null = null;
// Representa el final de la cola; comienza resuelta para aceptar la primera operación.
let operations: Promise<unknown> = Promise.resolve();

// El esquema protege también las escrituras realizadas directamente en SQLite:
// UUID único, categorías y estados restringidos, duración/frecuencia positivas
// y actividad obligatoria solo en entrenamiento. Las mediciones se almacenan
// como texto JSON; su contenido se valida en el servicio, no mediante este SQL.
// IF NOT EXISTS permite inicializar sin borrar registros. El índice facilita
// las consultas por estado de sincronización.
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

// Los rechazos del plugin pueden no ser instancias de Error. Se normaliza el
// mensaje para la interfaz y se conserva la causa original para el diagnóstico.
function contextualError(message: string, cause: unknown): Error {
  const detail = cause instanceof Error ? cause.message : String(cause);
  return new Error(`${message}: ${detail}`, { cause });
}

async function openDatabase(): Promise<SQLiteDBConnection> {
  // Esta integración usa SQLite nativo: no crea un sustituto temporal en web.
  // La disponibilidad del plugin permite detectar una sincronización pendiente.
  if (Capacitor.getPlatform() !== "android") {
    throw new Error("Esta integración SQLite requiere ejecutar la aplicación en Android.");
  }
  if (!Capacitor.isPluginAvailable("CapacitorSQLite")) {
    throw new Error("SQLite no está disponible. Sincroniza Capacitor y recompila la aplicación Android.");
  }

  // Reconcilia conexiones nativas, incluso después de recargar el WebView.
  await sqlite.checkConnectionsConsistency();
  const exists = await sqlite.isConnection(DATABASE_NAME, false);
  // Reutiliza la conexión registrada o crea una de lectura/escritura, sin cifrado,
  // con versión de esquema 1. El argumento readonly es false en ambos caminos.
  const db = exists.result
    ? await sqlite.retrieveConnection(DATABASE_NAME, false)
    : await sqlite.createConnection(DATABASE_NAME, false, "no-encryption", 1, false);

  // Tener una conexión registrada no implica que la base esté abierta.
  // La creación de tabla e índice debe terminar antes de entregar la conexión.
  if (!(await db.isDBOpen()).result) await db.open();
  await db.execute(SCHEMA);
  return db;
}

// Las llamadas concurrentes esperan la misma promesa, evitando aperturas
// duplicadas. Solo un fallo de inicialización invalida esa promesa para reintentar.
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

/**
 * Prepara la base local y su esquema, reutilizando la inicialización existente.
 * Las operaciones públicas también la solicitan internamente cuando es necesario.
 * @returns Promesa sin valor que se resuelve cuando la base está lista.
 * @throws Si Android, el plugin, la apertura o la creación del esquema fallan.
 */
export async function initializeDatabase(): Promise<void> {
  await getDatabase();
}

// Evita transacciones superpuestas si varios consumidores utilizan el servicio.
// Cada operación espera a la anterior y recibe una base inicializada. El resultado
// conserva su tipo y los errores se enriquecen con el contexto de la operación.
function withDatabase<T>(message: string, operation: (db: SQLiteDBConnection) => Promise<T>): Promise<T> {
  const result = operations.then(async () => {
    try {
      return await operation(await getDatabase());
    } catch (cause: unknown) {
      throw contextualError(message, cause);
    }
  });
  // El rechazo se absorbe solo en la cola para no bloquear trabajos posteriores;
  // el consumidor recibe result y, por tanto, sigue recibiendo el error original.
  operations = result.catch(() => undefined);
  return result;
}

// Los datos externos se tratan como unknown: los tipos de TypeScript por sí
// solos no garantizan la estructura de una fila SQLite o de un JSON recuperado.
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Rechaza cadenas numéricas, null, NaN e infinitos antes de serializar a JSON.
function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

// El tipo de sensores admite lecturas incompletas durante la captura, pero la
// persistencia exige las seis lecturas finitas y un tiempo relativo no negativo.
function isMeasurement(value: unknown): value is Medicion {
  return isObject(value)
    && isFiniteNumber(value.tiempo_ms) && value.tiempo_ms >= 0
    && [value.ax, value.ay, value.az, value.gx, value.gy, value.gz].every(isFiniteNumber);
}

// Valida tanto entradas de escritura como registros leídos. La aserción de tipo
// solo se cumple tras comprobar los datos; cualquier incumplimiento lanza un error.
function validateRecord(value: unknown): asserts value is Registro {
  if (!isObject(value)) throw new Error("El registro no es un objeto válido.");
  if (typeof value.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.id)) {
    throw new Error("El identificador debe ser un UUID.");
  }
  // Mantiene la misma relación tipo/actividad que el CHECK de la tabla:
  // una etiqueta conocida para entrenamiento y ninguna etiqueta para predicción.
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
  // Las métricas deben tener significado físico y poder representarse en JSON.
  if (!isFiniteNumber(value.duracion_ms) || value.duracion_ms <= 0
    || !isFiniteNumber(value.frecuencia_hz) || value.frecuencia_hz <= 0) {
    throw new Error("La duración y frecuencia deben ser números finitos positivos.");
  }
  // Array.from convierte los huecos de un arreglo disperso en undefined para
  // que también sean rechazados, en lugar de ser omitidos por every.
  if (!Array.isArray(value.mediciones) || value.mediciones.length === 0
    || !Array.from(value.mediciones).every(isMeasurement)) {
    throw new Error("Se requiere al menos una medición con tiempo válido y seis lecturas numéricas finitas.");
  }
  // La lectura admite ambos estados; saveRecord exige pendiente para altas nuevas.
  if (value.estado_sync !== "pendiente" && value.estado_sync !== "sincronizado") {
    throw new Error("Estado de sincronización inválido.");
  }
}

// Transforma el texto JSON de una fila en mediciones utilizables por la aplicación.
// JSON inválido o datos incompatibles hacen fallar la consulta: no se sustituyen
// silenciosamente por un arreglo vacío ni se descartan filas corruptas.
function decodeRecord(row: unknown): Registro {
  if (!isObject(row) || typeof row.mediciones !== "string") {
    throw new Error("Fila SQLite inválida: mediciones debe contener JSON.");
  }
  const mediciones: unknown = JSON.parse(row.mediciones);
  const record: unknown = { ...row, mediciones };
  validateRecord(record);
  return record;
}

/**
 * Inserta un registro nuevo, validando sus datos y serializando las mediciones.
 * @param registro Registro con UUID generado por el llamador en Android, fecha
 * ISO UTC canónica, mediciones completas y estado de sincronización pendiente.
 * @returns Promesa sin valor que se resuelve al completar la escritura.
 * @throws Si la validación falla, el UUID ya existe o SQLite rechaza la escritura.
 */
export async function saveRecord(registro: Registro): Promise<void> {
  // Validar y serializar antes de encolar crea una instantánea de los datos.
  let values: (string | number | null)[];
  try {
    validateRecord(registro);
    if (registro.estado_sync !== "pendiente") {
      throw new Error("Todo registro nuevo debe comenzar pendiente.");
    }
    // El JSON fija el contenido de las mediciones antes de esperar en la cola;
    // modificaciones posteriores del objeto recibido no alteran esta escritura.
    values = [registro.id, registro.tipo, registro.actividad, registro.fecha,
    registro.duracion_ms, registro.frecuencia_hz, JSON.stringify(registro.mediciones), "pendiente"];
  } catch (cause: unknown) {
    throw contextualError("No se pudo validar el registro para guardarlo", cause);
  }
  await withDatabase("No se pudo guardar el registro", async (db) => {
    // Los parámetros separan los datos del SQL. run utiliza por defecto una
    // transacción del plugin; guardar no depende de un evento de cierre de la app.
    // INSERT normal: un UUID duplicado produce error, nunca sobrescribe datos.
    await db.run(`INSERT INTO registros
      (id, tipo, actividad, fecha, duracion_ms, frecuencia_hz, mediciones, estado_sync)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, values);
  });
}

// Punto común de lectura: ejecuta SQL parametrizado y valida cada fila antes
// de devolverla. Los errores de SQLite, formato o JSON llegan al consumidor
// mediante el manejo de errores de withDatabase.
function queryRecords(statement: string, values: string[] = []): Promise<Registro[]> {
  return withDatabase("No se pudieron consultar los registros", async (db) => {
    const result = await db.query(statement, values);
    const rows: unknown = result.values;
    if (!Array.isArray(rows)) throw new Error("SQLite no devolvió una lista de filas.");
    return rows.map((row: unknown) => decodeRecord(row));
  });
}

/**
 * Consulta todos los registros locales con sus mediciones deserializadas.
 * @returns Registros por fecha descendente e ID ascendente, o una lista vacía.
 * @throws Si falla la consulta o alguna fila contiene datos inválidos.
 */
export function getRecords(): Promise<Registro[]> {
  return queryRecords("SELECT * FROM registros ORDER BY fecha DESC, id ASC");
}

/**
 * Consulta únicamente registros pendientes de sincronización, sin enviarlos.
 * @returns Lista de pendientes por fecha descendente e ID ascendente.
 * @throws Si falla la consulta o la validación de los registros recuperados.
 */
export function getPendingRecords(): Promise<Registro[]> {
  return queryRecords("SELECT * FROM registros WHERE estado_sync = ? ORDER BY fecha DESC, id ASC", ["pendiente"]);
}

/**
 * Recupera un registro por su identificador único.
 * @param id UUID que se desea buscar en SQLite.
 * @returns Registro con sus mediciones deserializadas, o null si no existe.
 * @throws Si falla la lectura o el registro almacenado no es válido.
 */
export async function getRecordById(id: string): Promise<Registro | null> {
  const records = await queryRecords("SELECT * FROM registros WHERE id = ?", [id]);
  return records[0] ?? null;
}

/**
 * Actualiza únicamente el estado local de un registro a sincronizado.
 * No realiza peticiones de red ni verifica una recepción remota; corresponde
 * al llamador invocarla cuando proceda confirmar la sincronización.
 * @param id UUID del registro cuyo estado se actualizará.
 * @returns Promesa sin valor que se resuelve al actualizar la fila.
 * @throws Si falla la escritura o no se actualiza exactamente una fila.
 */
export async function markAsSynced(id: string): Promise<void> {
  await withDatabase("No se pudo marcar el registro como sincronizado", async (db) => {
    const result = await db.run("UPDATE registros SET estado_sync = ? WHERE id = ?", ["sincronizado", id]);
    if (result.changes?.changes !== 1) throw new Error(`No existe el registro ${id}.`);
  });
}
