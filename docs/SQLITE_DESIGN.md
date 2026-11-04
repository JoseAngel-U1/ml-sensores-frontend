# Diseño SQLite — ML Sensores

## Alcance y estado

Diseño aprobado para la integración inicial. Implementación pendiente de verificación manual de tipos, lint, compilación y persistencia en Android. Base nativa local, sin conexión a internet y sin almacenamiento alternativo en memoria o localStorage.

- Base: `ml_sensores`.
- Versión: `1`.
- Tabla: `registros`.
- Plugin instalado: `@capacitor-community/sqlite` 8.1.1.
- Capacitor Core, Android y CLI instalados: 8.6.0.
- Conexión de lectura/escritura, sin cifrado configurado (`no-encryption`).

## Esquema aprobado

```sql
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
```

## Tipos

En `src/types/records.ts`:

```typescript
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
```

`Medicion` reutiliza `MedicionSensor`: `tiempo_ms` y las seis lecturas `ax`, `ay`, `az`, `gx`, `gy`, `gz`. Aunque el tipo de captura admite lecturas nulas para contabilizar eventos incompletos, el servicio rechaza esas lecturas al guardar.

## Reglas de almacenamiento

- El llamador genera el UUID en el dispositivo Android con `crypto.randomUUID()`; el servicio verifica su formato.
- Fecha ISO 8601 en la representación UTC canónica de `new Date().toISOString()`.
- Duración en milisegundos y frecuencia en Hz: números finitos positivos.
- Al menos una medición; cada una debe tener tiempo finito no negativo y seis lecturas numéricas finitas.
- Entrenamiento: actividad obligatoria entre las tres aprobadas. Predicción: actividad `null`.
- Todo registro nuevo debe tener estado `pendiente`; `saveRecord` rechaza otro estado.
- Mediciones serializadas con `JSON.stringify` y deserializadas con `JSON.parse`, validando también las filas recuperadas. JSON corrupto o filas inválidas generan un error explícito.
- Las inserciones usan parámetros y no sobrescriben UUID existentes: un duplicado es un error.
- La tabla y el índice se crean de forma idempotente; inicializar no borra datos.

## API del servicio

Archivo: `src/services/database.ts`.

| Función | Resultado y comportamiento |
|---|---|
| `initializeDatabase()` | `Promise<void>`; abre la conexión y crea tabla/índice si faltan. |
| `saveRecord(registro)` | `Promise<void>`; valida e inserta una instantánea del registro con estado pendiente. |
| `getRecords()` | `Promise<Registro[]>`; lista todos por fecha descendente e ID ascendente. |
| `getPendingRecords()` | `Promise<Registro[]>`; lista únicamente pendientes. |
| `getRecordById(id)` | `Promise<Registro \| null>`; recupera por UUID o devuelve `null`. |
| `markAsSynced(id)` | `Promise<void>`; actualiza solo el estado, falla si el UUID no existe. No realiza ninguna comunicación de red. |

Todas las operaciones inicializan la base cuando es necesario. Una única promesa comparte la inicialización concurrente; se recupera la conexión existente y se comprueba la consistencia con el plugin. Un fallo de inicialización permite reintentar. Las operaciones se encolan para evitar transacciones superpuestas, y una operación fallida no bloquea las siguientes. Los errores incluyen contexto y conservan la causa original.

La conexión permanece abierta durante la sesión; cada escritura se confirma mediante la transacción del plugin. La persistencia no depende de ejecutar código al cerrar la aplicación. Android conserva el archivo en el almacenamiento privado de la app. Borrar datos o desinstalar la app elimina esa persistencia.

## Configuración Android

El proyecto ya tiene SDK mínimo 24, SDK de compilación/objetivo 36, Java 21 y Android Gradle Plugin 8.13.2. Se revisó el Gradle del plugin instalado, que usa SDK 24/36 y Java 21. No se modificaron archivos nativos ni se requieren permisos de almacenamiento para la base privada.

Ejecutar `npx cap sync android` para registrar el plugin instalado y copiar el build web. No editar manualmente `capacitor.build.gradle` ni otros archivos generados. No se configura SQLite web en esta etapa: en navegador la sección muestra un error indicando que requiere Android.

## Comandos manuales

Desde `ml-sensores/`, ejecutar en orden y continuar solo si el comando anterior finaliza correctamente:

```bash
npm run typecheck
npm run lint
npm run build
npx cap sync android
npx cap open android
```

No hace falta instalar otra dependencia para esta integración. Estos comandos no fueron ejecutados por el agente.

## Prueba de persistencia en Xiaomi 11T

1. Ejecutar la aplicación actualizada desde Android Studio. Activar modo avión para probar el almacenamiento sin conexión.
2. En «Prueba temporal de SQLite», pulsar «Inicializar base de datos» dos veces. Ambas operaciones deben finalizar correctamente y conservar los datos.
3. Pulsar «Guardar registro de prueba». Se genera un UUID en Android y un entrenamiento `quieto` con dos mediciones sintéticas, duración 10000 ms, frecuencia 0.2 Hz y estado pendiente. No es una captura real.
4. Comprobar el mensaje «JSON verificado», que aparece tras guardar, consultar por UUID y comparar las mediciones recuperadas con las originales.
5. Anotar el UUID. Consultar todos y pendientes: debe aparecer con estado `pendiente`. Guardar un segundo registro: debe tener otro UUID.
6. Cerrar la aplicación y forzar su detención desde Ajustes de Android. No desinstalar ni borrar datos.
7. Reabrir sin conexión, inicializar y consultar **antes de guardar otro registro**. Ambos UUID deben permanecer.
8. Introducir el UUID anotado y pulsar «Consultar por UUID». Verificar fecha original, estado y las dos mediciones deserializadas: tiempos 0 y 5000 ms, lecturas 0.1–0.6 y 1.1–1.6.
9. Consultar un UUID inexistente: debe indicar que no existe sin perder los registros anteriores.
10. Ejecutar la captura real de sensores de 10 segundos y comprobar sus métricas habituales. La sección SQLite no guarda ni modifica esa captura.

`markAsSynced` queda disponible en el servicio, sin botón que simule una sincronización real. Su ejecución y los casos negativos de validación (lecturas nulas/no finitas, duplicados y combinaciones tipo/actividad incorrectas) quedan pendientes de verificación manual adicional. No se considera validada la integración hasta recibir los resultados de las verificaciones y de la prueba física.
