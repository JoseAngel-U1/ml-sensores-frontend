import { Capacitor } from "@capacitor/core";
import { conBloqueoRegistros } from "./recordOperations";
import { CapacitorSQLite, SQLiteConnection } from "@capacitor-community/sqlite";
import type { SQLiteDBConnection } from "@capacitor-community/sqlite";
import type { Medicion, Participante, Registro, RegistroResumen, TipoRegistro } from "../types/records";

// El gestor del plugin se comparte entre los consumidores de este módulo.
// La base reside en el almacenamiento privado de Android, no en el estado de React.
const DATABASE_NAME = "ml_sensores";
const DATABASE_VERSION = 2;
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

// user_version se actualiza en la misma transacción que el esquema. Las bases
// antiguas pueden declarar 0: la versión de conexión del plugin no la fijaba.
const MIGRATION_V2 = `
${SCHEMA}
CREATE TABLE participantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE
        CHECK (codigo GLOB 'P-[0-9][0-9][0-9]' AND id BETWEEN 1 AND 999)
);
ALTER TABLE registros ADD COLUMN participante_id TEXT
    REFERENCES participantes(codigo) ON DELETE RESTRICT;
CREATE INDEX idx_registros_participante ON registros (participante_id);
CREATE TRIGGER registros_participante_insert
BEFORE INSERT ON registros
BEGIN
    SELECT RAISE(ABORT, 'Participante incompatible con el tipo de captura')
    WHERE (NEW.tipo = 'entrenamiento' AND
        (NEW.participante_id IS NULL OR NOT EXISTS
            (SELECT 1 FROM participantes WHERE codigo = NEW.participante_id)))
        OR (NEW.tipo = 'prediccion' AND NEW.participante_id IS NOT NULL);
END;
CREATE TRIGGER registros_participante_update
BEFORE UPDATE OF participante_id, tipo ON registros
BEGIN
    SELECT RAISE(ABORT, 'Participante incompatible con el tipo de captura')
    WHERE (NEW.tipo = 'entrenamiento' AND
        (NEW.participante_id IS NULL OR NOT EXISTS
            (SELECT 1 FROM participantes WHERE codigo = NEW.participante_id)))
        OR (NEW.tipo = 'prediccion' AND NEW.participante_id IS NOT NULL);
END;
PRAGMA user_version = 2;
`;

async function migrateDatabase(db: SQLiteDBConnection): Promise<void> {
  const { version } = await db.getVersion();
  if (version === 0 || version === 1) {
    await db.execute(MIGRATION_V2, true);
  } else if (version !== DATABASE_VERSION) {
    throw new Error(`Versión SQLite no compatible: ${version}.`);
  }
  if ((await db.getVersion()).version !== DATABASE_VERSION) {
    throw new Error("No se pudo confirmar la migración SQLite a versión 2.");
  }
}

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
  // Reutiliza la conexión registrada o crea una de lectura/escritura, sin cifrado.
  // La migración explícita también cubre conexiones recuperadas del WebView.
  const db = exists.result
    ? await sqlite.retrieveConnection(DATABASE_NAME, false)
    : await sqlite.createConnection(DATABASE_NAME, false, "no-encryption", DATABASE_VERSION, false);

  // Tener una conexión registrada no implica que la base esté abierta.
  // La creación de tabla e índice debe terminar antes de entregar la conexión.
  if (!(await db.isDBOpen()).result) await db.open();
  await db.execute("PRAGMA foreign_keys = ON;", false);
  await migrateDatabase(db);
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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

// El tipo de sensores admite lecturas incompletas durante la captura, pero la
// persistencia exige las seis lecturas finitas y un tiempo relativo no negativo.
function isMeasurement(value: unknown): value is Medicion {
  return isObject(value)
    && isFiniteNumber(value.tiempo_ms) && value.tiempo_ms >= 0
    && [value.ax, value.ay, value.az, value.gx, value.gy, value.gz].every(isFiniteNumber);
}

function validateRecordMetadata(value: Record<string, unknown>): void {
  if (!isUuid(value.id)) {
    throw new Error("El identificador debe ser un UUID.");
  }
  const validActivity = value.actividad === "quieto" || value.actividad === "caminando" || value.actividad === "corriendo";
  if (!((value.tipo === "entrenamiento" && validActivity)
    || (value.tipo === "prediccion" && value.actividad === null))) {
    throw new Error("Un entrenamiento requiere actividad; una predicción requiere actividad nula.");
  }
  if (value.tipo === "prediccion" && value.participante_id != null) {
    throw new Error("Una predicción no admite participante.");
  }
  if (value.participante_id != null && !isParticipantCode(value.participante_id)) {
    throw new Error("El código de participante debe tener formato P-001.");
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
  // La lectura admite ambos estados; saveRecord exige pendiente para altas nuevas.
  if (value.estado_sync !== "pendiente" && value.estado_sync !== "sincronizado") {
    throw new Error("Estado de sincronización inválido.");
  }
}

// Valida tanto entradas de escritura como registros leídos. La aserción de tipo
// solo se cumple tras comprobar los datos; cualquier incumplimiento lanza un error.
function validateRecord(value: unknown): asserts value is Registro {
  if (!isObject(value)) throw new Error("El registro no es un objeto válido.");
  validateRecordMetadata(value);
  // Array.from convierte los huecos de un arreglo disperso en undefined para
  // que también sean rechazados, en lugar de ser omitidos por every.
  if (!Array.isArray(value.mediciones) || value.mediciones.length === 0
    || !Array.from(value.mediciones).every(isMeasurement)) {
    throw new Error("Se requiere al menos una medición con tiempo válido y seis lecturas numéricas finitas.");
  }
}

function validateRecordSummary(value: unknown): asserts value is RegistroResumen {
  if (!isObject(value)) throw new Error("El resumen del registro no es un objeto válido.");
  validateRecordMetadata(value);
  if (!isFiniteNumber(value.totalMediciones) || !Number.isInteger(value.totalMediciones)
    || value.totalMediciones <= 0) {
    throw new Error("El resumen debe indicar una cantidad positiva de mediciones.");
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
  if (record.tipo === "prediccion") delete record.participante_id;
  return record;
}

function decodeRecordSummary(row: unknown): RegistroResumen {
  if (!isObject(row)) throw new Error("Fila SQLite inválida: se esperaba un objeto.");
  const totalMediciones = row.total_mediciones;
  if (!isFiniteNumber(totalMediciones)) {
    throw new Error("Fila SQLite inválida: total_mediciones debe ser numérico.");
  }
  const summary: unknown = {
    id: row.id,
    tipo: row.tipo,
    actividad: row.actividad,
    ...(row.tipo === "entrenamiento" ? { participante_id: row.participante_id ?? null } : {}),
    fecha: row.fecha,
    duracion_ms: row.duracion_ms,
    frecuencia_hz: row.frecuencia_hz,
    estado_sync: row.estado_sync,
    totalMediciones,
  };
  validateRecordSummary(summary);
  return summary;
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
    if (registro.tipo === "entrenamiento" && !isParticipantCode(registro.participante_id)) {
      throw new Error("Selecciona un participante para guardar una nueva captura de entrenamiento.");
    }
    if (registro.tipo === "prediccion" && "participante_id" in registro) {
      throw new Error("No incluyas participante_id en una captura de predicción.");
    }
    // El JSON fija el contenido de las mediciones antes de esperar en la cola;
    // modificaciones posteriores del objeto recibido no alteran esta escritura.
    values = [registro.id, registro.tipo, registro.actividad, registro.fecha,
     registro.duracion_ms, registro.frecuencia_hz, JSON.stringify(registro.mediciones), "pendiente",
     registro.tipo === "entrenamiento" ? registro.participante_id ?? null : null];
  } catch (cause: unknown) {
    throw contextualError("No se pudo validar el registro para guardarlo", cause);
  }
  await withDatabase("No se pudo guardar el registro", async (db) => {
    // Los parámetros separan los datos del SQL. run utiliza por defecto una
    // transacción del plugin; guardar no depende de un evento de cierre de la app.
    // INSERT normal: un UUID duplicado produce error, nunca sobrescribe datos.
    await db.run(`INSERT INTO registros
      (id, tipo, actividad, fecha, duracion_ms, frecuencia_hz, mediciones, estado_sync, participante_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, values);
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

function queryRecordSummaries(tipo: TipoRegistro): Promise<RegistroResumen[]> {
  return withDatabase("No se pudieron consultar los resúmenes de registros", async (db) => {
    const result = await db.query(`SELECT id, tipo, actividad, participante_id, fecha, duracion_ms,
      frecuencia_hz, estado_sync, json_array_length(mediciones) AS total_mediciones
      FROM registros
      WHERE tipo = ?
      ORDER BY fecha DESC, id ASC`, [tipo]);
    const rows: unknown = result.values;
    if (!Array.isArray(rows)) throw new Error("SQLite no devolvió una lista de filas.");
    return rows.map((row: unknown) => decodeRecordSummary(row));
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

export function getRecordSummaries(tipo: TipoRegistro): Promise<RegistroResumen[]> {
  return queryRecordSummaries(tipo);
}

/**
 * Consulta únicamente registros pendientes de sincronización, sin enviarlos.
 * El filtro por tipo se aplica en SQL antes de deserializar las mediciones, de
 * modo que una fila corrupta de un tipo no bloquea la consulta del otro.
 * @param tipo Tipo opcional que se desea consultar; sin filtro devuelve ambos.
 * @returns Lista de pendientes por fecha descendente e ID ascendente.
 * @throws Si falla la consulta o la validación de los registros recuperados.
 */
export function getPendingRecords(tipo?: TipoRegistro): Promise<Registro[]> {
  const filtroTipo = tipo === undefined ? "" : " AND tipo = ?";
  const valores = tipo === undefined ? ["pendiente"] : ["pendiente", tipo];
  return queryRecords(
    `SELECT * FROM registros WHERE estado_sync = ?${filtroTipo} ORDER BY fecha DESC, id ASC`,
    valores,
  );
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

/** Comprueba tipo y estado en la misma sentencia que elimina la fila y sus muestras. */
export async function deletePendingRecord(tipo: TipoRegistro, id: string): Promise<void> {
  await conBloqueoRegistros(() => withDatabase("No se pudo eliminar el registro local", async (db) => {
    const result = await db.run(
      "DELETE FROM registros WHERE id = ? AND tipo = ? AND estado_sync = ?",
      [id, tipo, "pendiente"],
    );
    if (result.changes?.changes !== 1) {
      throw new Error("El registro ya no existe, no pertenece al módulo o ya no está pendiente.");
    }
  }));
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

function isParticipantCode(value: unknown): value is string {
  return typeof value === "string" && /^P-\d{3}$/.test(value) && value !== "P-000";
}

function decodeParticipant(row: unknown): Participante {
  if (!isObject(row) || !isFiniteNumber(row.id) || !Number.isInteger(row.id)
    || row.id < 1 || row.id > 999 || !isParticipantCode(row.codigo)
    || row.codigo !== `P-${String(row.id).padStart(3, "0")}`) {
    throw new Error("Participante SQLite inválido.");
  }
  return { id: row.id, codigo: row.codigo };
}

export function getParticipants(): Promise<Participante[]> {
  return withDatabase("No se pudieron consultar los participantes", async (db) => {
    const result = await db.query("SELECT id, codigo FROM participantes ORDER BY id ASC");
    const rows: unknown = result.values;
    if (!Array.isArray(rows)) throw new Error("SQLite no devolvió una lista de participantes.");
    return rows.map((row: unknown) => decodeParticipant(row));
  });
}

export function getNextParticipantCode(): Promise<string> {
  return withDatabase("No se pudo consultar el próximo código", async (db) => {
    const result = await db.query("SELECT COALESCE((SELECT seq FROM sqlite_sequence WHERE name = 'participantes'), 0) + 1 AS siguiente");
    const rows: unknown = result.values;
    const row: unknown = Array.isArray(rows) ? rows[0] : undefined;
    if (!isObject(row) || !isFiniteNumber(row.siguiente) || !Number.isInteger(row.siguiente)
      || row.siguiente < 1 || row.siguiente > 999) {
      throw new Error("No hay códigos disponibles dentro del formato P-001 a P-999.");
    }
    return `P-${String(row.siguiente).padStart(3, "0")}`;
  });
}

export function createParticipant(): Promise<Participante> {
  return withDatabase("No se pudo crear el participante", async (db) => {
    // Una sola sentencia asigna código e id bajo el bloqueo de escritura SQLite.
    // AUTOINCREMENT conserva sqlite_sequence incluso al eliminar la última fila.
    const result = await db.run(`INSERT INTO participantes (codigo)
      SELECT printf('P-%03d', COALESCE((SELECT seq FROM sqlite_sequence
      WHERE name = 'participantes'), 0) + 1)
      WHERE COALESCE((SELECT seq FROM sqlite_sequence WHERE name = 'participantes'), 0) < 999`);
    const id = result.changes?.lastId;
    if (result.changes?.changes !== 1 || typeof id !== "number") {
      throw new Error("No hay códigos disponibles dentro del formato P-001 a P-999.");
    }
    return decodeParticipant({ id, codigo: `P-${String(id).padStart(3, "0")}` });
  });
}

export function deleteParticipant(codigo: string): Promise<void> {
  return withDatabase("No se pudo eliminar el participante", async (db) => {
    if (!isParticipantCode(codigo)) throw new Error("Código de participante inválido.");
    const result = await db.run(`DELETE FROM participantes WHERE codigo = ?
      AND NOT EXISTS (SELECT 1 FROM registros WHERE participante_id = ?)`, [codigo, codigo]);
    if (result.changes?.changes !== 1) {
      throw new Error("El participante tiene capturas asociadas o ya no existe. No se eliminó ningún registro.");
    }
  });
}
