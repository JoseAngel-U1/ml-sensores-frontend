import type { Actividad, Medicion } from "./records";

export type EstadoResultadoSync = "guardado" | "existente" | "fallido";

/**
 ** Contrato confirmado de FastAPI. La solicitud usa el arreglo `registros`;
 ** la respuesta usa el mismo nombre para los resultados individuales.
 ** `id_local` es el UUID de SQLite y `id_mongo` el ObjectId serializado.
 */
export interface RegistroEntrenamientoSync {
  id_local: string;
  tipo: "entrenamiento";
  participante_id: string;
  actividad: Actividad;
  fecha: string;
  duracion_ms: number;
  frecuencia_hz: number;
  mediciones: Medicion[];
}

export interface RegistroPrediccionSync {
  id_local: string;
  tipo: "prediccion";
  actividad: null;
  fecha: string;
  duracion_ms: number;
  frecuencia_hz: number;
  mediciones: Medicion[];
}

export type RegistroSync = RegistroEntrenamientoSync | RegistroPrediccionSync;

export interface SolicitudSyncEntrenamiento {
  registros: RegistroEntrenamientoSync[];
}

export interface SolicitudSyncPrediccion {
  registros: RegistroPrediccionSync[];
}

export interface ResultadoSync {
  id_local: string | null;
  id_mongo: string | null;
  estado: EstadoResultadoSync;
  error?: string;
}

export interface RespuestaSync {
  recibidos: number;
  guardados: number;
  existentes: number;
  fallidos: number;
  registros: ResultadoSync[];
}
