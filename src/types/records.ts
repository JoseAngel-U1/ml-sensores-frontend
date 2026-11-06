import type { MedicionCompleta } from "./sensores";

export type Actividad = "quieto" | "caminando" | "corriendo";
export type TipoRegistro = "entrenamiento" | "prediccion";
export type EstadoSync = "pendiente" | "sincronizado";
export type EstadoGuardadoCaptura = "inactivo" | "guardando" | "guardado" | "incompleta" | "error";

/**
 ** La persistencia exige los seis ejes numéricos finitos, por lo que reutiliza
 ** la variante completa de la medición de sensores en lugar de la que admite null.
 */
export type Medicion = MedicionCompleta;

/**
 ** Representación de una sesión en la aplicación. En SQLite, mediciones se guarda
 ** como texto JSON y vuelve a ser un arreglo al consultar el registro.
 ** La relación entre tipo y actividad se comprueba en el servicio y en la tabla:
 ** entrenamiento requiere una etiqueta y predicción requiere actividad null.
 */
export interface Registro {
  //* UUID generado en el dispositivo; identifica la misma sesión al recuperarla.
  id: string;
  tipo: TipoRegistro;
  //* Etiqueta de entrenamiento o null para una sesión destinada a predicción.
  actividad: Actividad | null;
  //* Fecha ISO 8601 UTC canónica, generada con Date.toISOString().
  fecha: string;
  //* Duración de la sesión en milisegundos; debe ser finita y positiva.
  duracion_ms: number;
  //* Frecuencia medida en Hz, finita y positiva; no se asume una tasa constante.
  frecuencia_hz: number;
  //* Muestras de la sesión; el servicio exige al menos una medición completa.
  mediciones: Medicion[];
  //* Seguimiento local de sincronización, independiente de los valores de sensores.
  estado_sync: EstadoSync;
}

export type RegistroResumen = Omit<Registro, "mediciones"> & {
  totalMediciones: number;
};
