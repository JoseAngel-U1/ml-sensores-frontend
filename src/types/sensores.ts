export type EstadoCaptura =
  | "Listo para iniciar"
  | "Preparando..."
  | "Capturando..."
  | "Captura finalizada";

export interface MedicionSensor {
  tiempo_ms: number;
  ax: number | null;
  ay: number | null;
  az: number | null;
  gx: number | null;
  gy: number | null;
  gz: number | null;
}

export interface ResultadoCaptura {
  total: number;
  validas: number;
  invalidas: number;
  // Valores formateados con toFixed(2) para su visualización.
  frecuencia: string;
  duracion: string;
  primera: MedicionSensor | null;
  ultima: MedicionSensor | null;
  // Instantánea completa de la sesión finalizada, incluidas las muestras incompletas.
  // Se conserva para un guardado posterior; el hook no realiza persistencia.
  mediciones: MedicionSensor[];
}
