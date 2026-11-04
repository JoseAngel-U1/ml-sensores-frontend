import type { MedicionSensor } from "./sensores";

export type Actividad = "quieto" | "caminando" | "corriendo";
export type TipoRegistro = "entrenamiento" | "prediccion";
export type EstadoSync = "pendiente" | "sincronizado";
export type Medicion = MedicionSensor;

export interface Registro {
  id: string;
  tipo: TipoRegistro;
  actividad: Actividad | null;
  fecha: string;
  duracion_ms: number;
  frecuencia_hz: number;
  mediciones: Medicion[];
  estado_sync: EstadoSync;
}
