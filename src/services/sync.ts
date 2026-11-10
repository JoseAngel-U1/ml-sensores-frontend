import { requestApi, waitForApiRequestCompletion } from "./api";
import { getPendingRecords, getRecordById, markAsSynced } from "./database";
import { conBloqueoRegistros } from "./recordOperations";
import type { Actividad, Medicion, Registro, TipoRegistro } from "../types/records";
import type {
  EstadoResultadoSync,
  RegistroEntrenamientoSync,
  RegistroPrediccionSync,
  RegistroSync,
  RespuestaSync,
  ResultadoSync,
} from "../types/sync";

export const TAMANO_LOTE_SYNC = 5;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;
const PARTICIPANTE_PATTERN = /^P-\d{3}$/;

// El bloqueo cubre todo el ciclo: lectura, envío por lotes y actualización local.
// Es independiente del bloqueo de requestApi, que solo protege cada petición.

export class SyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyncError";
  }
}

export interface ElegibilidadLocal {
  elegible: boolean;
  motivo: string | null;
}

export interface OmitidoSync {
  id: string;
  motivo: string;
}

export interface ErrorMarcadoSync {
  id: string;
  error: string;
}

export interface ResumenSincronizacion {
  tipo: TipoRegistro;
  pendientes: number;
  elegibles: number;
  omitidos: OmitidoSync[];
  lotes: number;
  enviados: number;
  guardados: number;
  existentes: number;
  fallidos: number;
  confirmados: number;
  marcados: number;
  erroresMarcado: ErrorMarcadoSync[];
  errores: string[];
  completado: boolean;
}

export interface RespuestaProcesada {
  respuesta: RespuestaSync;
  idsConfirmados: string[];
  idsPendientes: string[];
}

export interface ConfirmacionesSync {
  idsConfirmados: string[];
  idsPendientes: string[];
}

function esObjeto(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function esNumeroFinito(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function esEnteroNoNegativo(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function esActividad(value: unknown): value is Actividad {
  return value === "quieto" || value === "caminando" || value === "corriendo";
}

function esCodigoParticipante(value: unknown): value is string {
  return typeof value === "string" && PARTICIPANTE_PATTERN.test(value) && value !== "P-000";
}

function uuidCanonico(value: unknown): string | null {
  return typeof value === "string" && UUID_PATTERN.test(value) ? value.toLowerCase() : null;
}

function esMedicionCompleta(value: unknown): value is Medicion {
  return esObjeto(value)
    && esNumeroFinito(value.tiempo_ms) && value.tiempo_ms >= 0
    && [value.ax, value.ay, value.az, value.gx, value.gy, value.gz].every(esNumeroFinito);
}

function mensajeError(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

function rutaSync(tipo: TipoRegistro): string {
  return tipo === "entrenamiento" ? "/entrenamiento" : "/prediccion";
}

/**
 * Comprueba localmente si una captura puede enviarse sin intervención manual.
 * Los entrenamientos históricos sin participante se omiten; no se les asigna uno.
 */
export function validarElegibilidadLocal(registro: Registro): ElegibilidadLocal {
  const noElegible = (motivo: string): ElegibilidadLocal => ({ elegible: false, motivo });

  if (registro.estado_sync !== "pendiente") {
    return noElegible("El registro no está pendiente de sincronización.");
  }
  if (uuidCanonico(registro.id) === null) {
    return noElegible("El identificador local no es un UUID válido.");
  }
  if (typeof registro.fecha !== "string" || !Number.isFinite(Date.parse(registro.fecha))) {
    return noElegible("La fecha del registro no es válida.");
  }
  if (!esNumeroFinito(registro.duracion_ms) || registro.duracion_ms <= 0
    || !esNumeroFinito(registro.frecuencia_hz) || registro.frecuencia_hz <= 0) {
    return noElegible("La duración y la frecuencia deben ser números finitos positivos.");
  }
  if (!Array.isArray(registro.mediciones) || registro.mediciones.length === 0
    || !registro.mediciones.every(esMedicionCompleta)) {
    return noElegible("El registro no contiene mediciones completas.");
  }

  if (registro.tipo === "entrenamiento") {
    if (!esActividad(registro.actividad)) {
      return noElegible("El entrenamiento requiere una actividad válida.");
    }
    if (!esCodigoParticipante(registro.participante_id)) {
      return noElegible("El entrenamiento requiere un participante entre P-001 y P-999.");
    }
    return { elegible: true, motivo: null };
  }

  if (registro.actividad !== null) {
    return noElegible("La predicción requiere actividad nula.");
  }
  if ("participante_id" in registro) {
    return noElegible("La predicción no admite participante_id.");
  }
  return { elegible: true, motivo: null };
}

function copiarMediciones(mediciones: readonly Medicion[]): Medicion[] {
  return mediciones.map((medicion) => ({
    tiempo_ms: medicion.tiempo_ms,
    ax: medicion.ax,
    ay: medicion.ay,
    az: medicion.az,
    gx: medicion.gx,
    gy: medicion.gy,
    gz: medicion.gz,
  }));
}

/**
 * Construye explícitamente el cuerpo de entrenamiento. No reutiliza el objeto
 * SQLite para evitar enviar estado_sync, id, totalMediciones o campos internos.
 */
export function transformarEntrenamiento(registro: Registro): RegistroEntrenamientoSync {
  const elegibilidad = validarElegibilidadLocal(registro);
  if (!elegibilidad.elegible) {
    throw new SyncError(`El registro ${registro.id} no puede sincronizarse: ${elegibilidad.motivo ?? "no es elegible"}.`);
  }
  const actividad = registro.actividad;
  const participanteId = registro.participante_id;
  if (registro.tipo !== "entrenamiento" || !esActividad(actividad) || !esCodigoParticipante(participanteId)) {
    throw new SyncError(`El registro ${registro.id} no es un entrenamiento válido.`);
  }
  return {
    id_local: registro.id,
    tipo: "entrenamiento",
    participante_id: participanteId,
    actividad,
    fecha: registro.fecha,
    duracion_ms: registro.duracion_ms,
    frecuencia_hz: registro.frecuencia_hz,
    mediciones: copiarMediciones(registro.mediciones),
  };
}

/**
 * Construye explícitamente el cuerpo de predicción. `participante_id` se omite
 * por completo, no se envía como null.
 */
export function transformarPrediccion(registro: Registro): RegistroPrediccionSync {
  const elegibilidad = validarElegibilidadLocal(registro);
  if (!elegibilidad.elegible) {
    throw new SyncError(`El registro ${registro.id} no puede sincronizarse: ${elegibilidad.motivo ?? "no es elegible"}.`);
  }
  if (registro.tipo !== "prediccion" || registro.actividad !== null || "participante_id" in registro) {
    throw new SyncError(`El registro ${registro.id} no es una predicción válida.`);
  }
  return {
    id_local: registro.id,
    tipo: "prediccion",
    actividad: null,
    fecha: registro.fecha,
    duracion_ms: registro.duracion_ms,
    frecuencia_hz: registro.frecuencia_hz,
    mediciones: copiarMediciones(registro.mediciones),
  };
}

export function transformarRegistro(registro: Registro): RegistroSync {
  return registro.tipo === "entrenamiento"
    ? transformarEntrenamiento(registro)
    : transformarPrediccion(registro);
}

export function construirLotes<T>(elementos: readonly T[], tamano: number = TAMANO_LOTE_SYNC): T[][] {
  if (!Number.isInteger(tamano) || tamano <= 0) {
    throw new SyncError("El tamaño de lote debe ser un entero positivo.");
  }
  const lotes: T[][] = [];
  for (let indice = 0; indice < elementos.length; indice += tamano) {
    lotes.push(elementos.slice(indice, indice + tamano));
  }
  return lotes;
}

function analizarCuerpo(data: unknown): unknown {
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data) as unknown;
  } catch {
    throw new SyncError("La respuesta del servidor no contiene JSON válido.");
  }
}

function crearResultado(
  idLocal: string,
  idMongo: string | null,
  estado: EstadoResultadoSync,
  error: string | undefined,
): ResultadoSync {
  return estado === "fallido"
    ? { id_local: idLocal, id_mongo: null, estado, error: error ?? "Error no especificado." }
    : { id_local: idLocal, id_mongo: idMongo, estado };
}

/**
 * Determina qué UUID del lote pueden marcarse como sincronizados. Solo cuentan
 * los estados guardado/existente con id_mongo válido; el resto permanece pendiente.
 */
export function determinarConfirmaciones(
  resultados: readonly ResultadoSync[],
  lote: readonly Registro[],
): ConfirmacionesSync {
  const porCanonico = new Map<string, Registro>();
  for (const registro of lote) {
    const clave = uuidCanonico(registro.id);
    if (clave !== null && !porCanonico.has(clave)) {
      porCanonico.set(clave, registro);
    }
  }

  const confirmados = new Set<string>();
  for (const resultado of resultados) {
    if (resultado.estado === "fallido" || resultado.id_mongo === null) continue;
    const clave = uuidCanonico(resultado.id_local);
    if (clave === null) continue;
    const registro = porCanonico.get(clave);
    if (registro !== undefined) confirmados.add(registro.id);
  }

  return {
    idsConfirmados: lote.filter((registro) => confirmados.has(registro.id)).map((registro) => registro.id),
    idsPendientes: lote.filter((registro) => !confirmados.has(registro.id)).map((registro) => registro.id),
  };
}

/**
 * Valida la respuesta como unknown y correlaciona cada resultado con el lote
 * enviado usando el UUID canónico. Cualquier resultado desconocido, duplicado,
 * ausente o contradictorio invalida la respuesta completa y no se actualiza SQLite.
 */
export function validarYCorrelacionarRespuesta(
  data: unknown,
  lote: readonly Registro[],
): RespuestaProcesada {
  const cuerpo = analizarCuerpo(data);
  if (!esObjeto(cuerpo)) {
    throw new SyncError("La respuesta del servidor no es un objeto.");
  }

  const { recibidos, guardados, existentes, fallidos } = cuerpo;
  if (!esEnteroNoNegativo(recibidos) || !esEnteroNoNegativo(guardados)
    || !esEnteroNoNegativo(existentes) || !esEnteroNoNegativo(fallidos)) {
    throw new SyncError("La respuesta contiene contadores inválidos.");
  }
  const registros: unknown = cuerpo.registros;
  if (!Array.isArray(registros)) {
    throw new SyncError("La respuesta no contiene el arreglo de resultados.");
  }
  const listaResultados: unknown[] = registros;
  if (recibidos !== lote.length) {
    throw new SyncError(`La respuesta indica ${recibidos} recibidos para un lote de ${lote.length}.`);
  }
  if (guardados + existentes + fallidos !== recibidos) {
    throw new SyncError("Los contadores de la respuesta no coinciden con los recibidos.");
  }
  if (listaResultados.length !== recibidos) {
    throw new SyncError("La cantidad de resultados no coincide con los recibidos.");
  }

  const esperados = new Map<string, Registro>();
  for (const registro of lote) {
    const clave = uuidCanonico(registro.id);
    if (clave === null) {
      throw new SyncError(`El lote contiene un UUID inválido: ${registro.id}.`);
    }
    if (esperados.has(clave)) {
      throw new SyncError(`El lote contiene un UUID duplicado: ${clave}.`);
    }
    esperados.set(clave, registro);
  }

  const vistos = new Set<string>();
  const resultados: ResultadoSync[] = [];
  let totalGuardados = 0;
  let totalExistentes = 0;
  let totalFallidos = 0;

  for (const item of listaResultados) {
    if (!esObjeto(item)) {
      throw new SyncError("La respuesta contiene un resultado que no es un objeto.");
    }
    const estado = item.estado;
    if (estado !== "guardado" && estado !== "existente" && estado !== "fallido") {
      throw new SyncError("La respuesta contiene un estado de sincronización desconocido.");
    }
    if (typeof item.id_local !== "string") {
      throw new SyncError("La respuesta contiene un resultado sin id_local.");
    }
    const idLocal = item.id_local;
    const clave = uuidCanonico(idLocal);
    if (clave === null) {
      throw new SyncError(`La respuesta contiene un id_local inválido: ${idLocal}.`);
    }
    if (vistos.has(clave)) {
      throw new SyncError(`La respuesta repite el UUID ${clave}.`);
    }
    vistos.add(clave);
    const registro = esperados.get(clave);
    if (registro === undefined) {
      throw new SyncError(`La respuesta contiene un UUID desconocido: ${clave}.`);
    }

    const idMongo = item.id_mongo;
    if (idMongo !== null) {
      if (typeof idMongo !== "string" || !OBJECT_ID_PATTERN.test(idMongo)) {
        throw new SyncError(`La respuesta contiene un id_mongo inválido para ${clave}.`);
      }
    }
    const error = item.error;
    if (error !== undefined && typeof error !== "string") {
      throw new SyncError(`La respuesta contiene un error no textual para ${clave}.`);
    }

    if (estado === "fallido") {
      if (idMongo !== null) {
        throw new SyncError(`El resultado fallido de ${clave} no debe incluir id_mongo.`);
      }
      if (typeof error !== "string" || !error.trim()) {
        throw new SyncError(`El resultado fallido de ${clave} no incluye una descripción.`);
      }
    } else if (error !== undefined) {
      throw new SyncError(`El resultado ${estado} de ${clave} no debe incluir error.`);
    }

    resultados.push(crearResultado(idLocal, idMongo, estado, error));
    if (estado === "guardado") totalGuardados += 1;
    else if (estado === "existente") totalExistentes += 1;
    else totalFallidos += 1;
  }

  for (const clave of esperados.keys()) {
    if (!vistos.has(clave)) {
      throw new SyncError(`La respuesta no incluye el UUID ${clave}.`);
    }
  }
  if (totalGuardados !== guardados || totalExistentes !== existentes || totalFallidos !== fallidos) {
    throw new SyncError("Los contadores no coinciden con los estados de los resultados.");
  }

  const { idsConfirmados, idsPendientes } = determinarConfirmaciones(resultados, lote);

  return {
    respuesta: { recibidos, guardados, existentes, fallidos, registros: resultados },
    idsConfirmados,
    idsPendientes,
  };
}

interface SeparacionLocal {
  elegibles: Registro[];
  omitidos: OmitidoSync[];
}

function separarElegibles(registros: readonly Registro[]): SeparacionLocal {
  const elegibles: Registro[] = [];
  const omitidos: OmitidoSync[] = [];
  const porCanonico = new Map<string, Registro[]>();

  for (const registro of registros) {
    const elegibilidad = validarElegibilidadLocal(registro);
    if (!elegibilidad.elegible) {
      omitidos.push({ id: registro.id, motivo: elegibilidad.motivo ?? "No elegible para sincronizar." });
      continue;
    }
    const clave = registro.id.toLowerCase();
    const grupo = porCanonico.get(clave);
    if (grupo === undefined) {
      porCanonico.set(clave, [registro]);
    } else {
      grupo.push(registro);
    }
  }

  for (const grupo of porCanonico.values()) {
    if (grupo.length === 1) {
      const unico = grupo[0];
      if (unico !== undefined) elegibles.push(unico);
    } else {
      for (const registro of grupo) {
        omitidos.push({ id: registro.id, motivo: "UUID duplicado en la base local." });
      }
    }
  }

  return { elegibles, omitidos };
}

async function ejecutarSincronizacion(tipo: TipoRegistro, pendientes: Registro[]): Promise<ResumenSincronizacion> {
  const { elegibles, omitidos } = separarElegibles(pendientes);
  const resumen: ResumenSincronizacion = {
    tipo,
    pendientes: pendientes.length,
    elegibles: elegibles.length,
    omitidos,
    lotes: 0,
    enviados: 0,
    guardados: 0,
    existentes: 0,
    fallidos: 0,
    confirmados: 0,
    marcados: 0,
    erroresMarcado: [],
    errores: [],
    completado: true,
  };

  for (const lote of construirLotes(elegibles)) {
    resumen.lotes += 1;
    try {
      const transformados = lote.map((registro) => transformarRegistro(registro));
      const respuesta = await requestApi({
        method: "POST",
        path: rutaSync(tipo),
        data: { registros: transformados },
      });
      resumen.enviados += lote.length;
      if (respuesta.status !== 200) {
        throw new SyncError(`La sincronización requiere HTTP 200 y se recibió ${respuesta.status}.`);
      }
      const procesada = validarYCorrelacionarRespuesta(respuesta.data, lote);
      resumen.guardados += procesada.respuesta.guardados;
      resumen.existentes += procesada.respuesta.existentes;
      resumen.fallidos += procesada.respuesta.fallidos;
      resumen.confirmados += procesada.idsConfirmados.length;

      for (const id of procesada.idsConfirmados) {
        try {
          await markAsSynced(id);
          resumen.marcados += 1;
        } catch (cause: unknown) {
          resumen.erroresMarcado.push({ id, error: mensajeError(cause) });
        }
      }
    } catch (cause: unknown) {
      resumen.completado = false;
      resumen.errores.push(mensajeError(cause));
      break;
    }
  }

  return resumen;
}

/**
 * Sincroniza manualmente los pendientes de un tipo.
 * Ante un fallo de red o una respuesta inválida no se marca nada
 * de ese lote: los UUID se conservan y el siguiente intento es idempotente.
 */
export async function sincronizarPendientes(tipo: TipoRegistro): Promise<ResumenSincronizacion> {
  return conBloqueoRegistros(async () => {
    try {
      return await ejecutarSincronizacion(tipo, await getPendingRecords(tipo));
    } finally {
      // Un timeout visual no cancela necesariamente la solicitud nativa.
      await waitForApiRequestCompletion();
    }
  });
}

export async function sincronizarRegistro(tipo: TipoRegistro, idLocal: string): Promise<ResumenSincronizacion> {
  return conBloqueoRegistros(async () => {
    try {
      const registro = await getRecordById(idLocal);
      if (registro === null || registro.tipo !== tipo || registro.estado_sync !== "pendiente") {
        throw new SyncError("El registro no existe, no pertenece al módulo o ya no está pendiente.");
      }
      // El mismo procesador valida elegibilidad, transforma, correlaciona y marca.
      return await ejecutarSincronizacion(tipo, [registro]);
    } finally {
      await waitForApiRequestCompletion();
    }
  });
}
