# Diseño SQLite — ML Sensores

## Alcance y estado

El esquema original y los flujos de captura/listados fueron validados en Android. La Fase 5-B de participantes está completada y validada por el usuario en Xiaomi 11T: typecheck, lint y build correctos, aplicación compilada y ejecutada, gestión de participantes funcional y rediseño aprobado. Base nativa local, sin conexión a internet y sin almacenamiento alternativo en memoria o localStorage. La confirmación general no acredita por separado cada caso técnico del procedimiento de pruebas.

Las fases 5-C a 5-D.3 también están completadas y validadas por el usuario: ambos módulos sincronizan manualmente con FastAPI/MongoDB y permiten eliminar registros locales pendientes. Estas operaciones reutilizan el esquema v2, sin nuevas migraciones.

- Base: `ml_sensores`.
- Versión objetivo: `2`, controlada mediante `PRAGMA user_version`.
- Tablas: `registros` y `participantes`.
- Plugin instalado: `@capacitor-community/sqlite` 8.1.1.
- Capacitor Core, Android y CLI instalados: 8.6.0.
- Conexión de lectura/escritura, sin cifrado configurado (`no-encryption`).

## Esquema con participantes (Fase 5-B)

```sql
CREATE TABLE participantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE
        CHECK (codigo GLOB 'P-[0-9][0-9][0-9]' AND id BETWEEN 1 AND 999)
);

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
    participante_id TEXT REFERENCES participantes(codigo) ON DELETE RESTRICT,
    CHECK (
        (tipo = 'entrenamiento' AND actividad IS NOT NULL)
        OR
        (tipo = 'prediccion' AND actividad IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_registros_estado
ON registros (estado_sync);
CREATE INDEX idx_registros_participante ON registros (participante_id);
```

La migración añade `participante_id` mediante `ALTER TABLE`, sin reconstruir ni borrar `registros`. Dos triggers (`registros_participante_insert` y `registros_participante_update`) exigen un participante existente al insertar entrenamiento o cambiar su asociación/tipo; impiden un participante no nulo en predicción. La lectura conserva los entrenamientos históricos sin participante. Actualizar solo `estado_sync` no ejecuta el trigger de asociación.

### Migración versionada

`migrateDatabase()` se ejecuta al inicializar la conexión, incluso si esta se recuperó del plugin. Para `user_version` 0 o 1, `db.execute(MIGRATION_V2, true)` crea el esquema original si falta, crea participantes, añade la columna/índice/triggers y fija `user_version = 2` dentro de la misma transacción. Con versión 2 no repite el ALTER. Una versión desconocida se rechaza explícitamente.

Se admite 0 porque la implementación anterior pasaba versión 1 a `createConnection` pero no establecía explícitamente `user_version`; la versión de origen se consulta en el dispositivo. Se habilitan claves foráneas antes de migrar. Los UUID, JSON de mediciones, fechas, métricas y estados existentes se conservan. Las capturas históricas reciben NULL, sin asignación automática. El usuario confirmó el funcionamiento de la aplicación y de participantes en Xiaomi 11T; no se dispone de un resultado individual de comparación de datos anteriores/posteriores a la migración.

### Secuencia de participantes y eliminación

- `AUTOINCREMENT` utiliza `sqlite_sequence`, cuyo último valor persiste aunque se elimine el participante más alto o todos los participantes.
- `getNextParticipantCode()` consulta ese contador únicamente para la confirmación; cancelar no inserta ni consume códigos.
- `createParticipant()` asigna el código definitivo mediante un único `INSERT ... SELECT`, dentro de la transacción de `db.run`. La cola compartida serializa las operaciones y el bloqueo de escritura de SQLite protege la sentencia; `UNIQUE` impide duplicados.
- La interfaz bloquea pulsaciones repetidas mediante una referencia inmediata y deshabilita controles durante la operación.
- Se admiten P-001 a P-999 para respetar el formato de tres dígitos de la API. Agotado ese rango se informa el error; no se reinicia ni recicla la secuencia.
- `deleteParticipant(codigo)` elimina solo si no hay registros asociados mediante un `DELETE ... AND NOT EXISTS`. La clave foránea con `ON DELETE RESTRICT` proporciona protección adicional. No hay borrado en cascada.

## Tipos

En `src/types/records.ts`:

```typescript
import type { MedicionCompleta } from "./sensores";

export type Actividad = "quieto" | "caminando" | "corriendo";
export type TipoRegistro = "entrenamiento" | "prediccion";
export type EstadoSync = "pendiente" | "sincronizado";
export type Medicion = MedicionCompleta;

export interface Registro {
  id: string;
  tipo: TipoRegistro;
  actividad: Actividad | null;
  participante_id?: string | null;
  fecha: string;
  duracion_ms: number;
  frecuencia_hz: number;
  mediciones: Medicion[];
  estado_sync: EstadoSync;
}

export type RegistroResumen = Omit<Registro, "mediciones"> & {
  totalMediciones: number;
};
```

`Medicion` reutiliza `MedicionCompleta`: `tiempo_ms` y las seis lecturas `ax`, `ay`, `az`, `gx`, `gy`, `gz`. Aunque el tipo de captura admite lecturas nulas para contabilizar eventos incompletos, el servicio rechaza esas lecturas al guardar.

## Reglas de almacenamiento

- El llamador genera el UUID en el dispositivo Android con `crypto.randomUUID()`; el servicio verifica su formato.
- Fecha ISO 8601 en la representación UTC canónica de `new Date().toISOString()`.
- Duración en milisegundos y frecuencia en Hz: números finitos positivos.
- Al menos una medición; cada una debe tener tiempo finito no negativo y seis lecturas numéricas finitas.
- Entrenamiento: actividad obligatoria entre las tres aprobadas. Predicción: actividad `null`.
- Nuevos entrenamientos: `participante_id` obligatorio y correspondiente a un participante existente. Lectura histórica: se admite NULL/ausente.
- Predicción: `Registro` no incluye la propiedad `participante_id`; la columna compartida almacena NULL y la lectura la omite del objeto. `saveRecord` rechaza esa propiedad en entradas de predicción incluso si vale null.
- Todo registro nuevo debe tener estado `pendiente`; `saveRecord` rechaza otro estado.
- Mediciones serializadas con `JSON.stringify` y deserializadas con `JSON.parse`, validando también las filas recuperadas. JSON corrupto o filas inválidas generan un error explícito.
- Las inserciones usan parámetros y no sobrescriben UUID existentes: un duplicado es un error.
- La tabla y el índice se crean de forma idempotente; inicializar no borra datos.

## API del servicio

Archivo: `src/services/database.ts`.

| Función | Resultado y comportamiento |
|---|---|
| `initializeDatabase()` | `Promise<void>`; abre/reutiliza la conexión, habilita claves foráneas y aplica la migración explícita cuando `user_version` es 0 o 1; verifica versión 2. |
| `saveRecord(registro)` | `Promise<void>`; valida e inserta una instantánea del registro con estado pendiente. |
| `getRecords()` | `Promise<Registro[]>`; lista todos por fecha descendente e ID ascendente. |
| `getRecordSummaries(tipo)` | `Promise<RegistroResumen[]>`; lista resúmenes del tipo indicado, sin mediciones y con `totalMediciones` calculado mediante `json_array_length()`. |
| `getPendingRecords(tipo?)` | `Promise<Registro[]>`; lista pendientes, opcionalmente de un tipo. El filtro SQL se aplica antes de deserializar; sin argumento devuelve ambos tipos. |
| `getRecordById(id)` | `Promise<Registro \| null>`; recupera por UUID o devuelve `null`. |
| `markAsSynced(id)` | `Promise<void>`; actualiza solo el estado, falla si el UUID no existe. No realiza ninguna comunicación de red. |
| `deletePendingRecord(tipo, id)` | `Promise<void>`; adquiere el bloqueo compartido y elimina exactamente una fila condicionada por UUID, tipo y estado pendiente; falla si ya no coincide. No realiza HTTP. |
| `getParticipants()` | Lista `{ id, codigo }` por ID ascendente. |
| `getNextParticipantCode()` | Obtiene el próximo código previsto sin reservarlo. |
| `createParticipant()` | Crea y devuelve el participante con código asignado durante la escritura. |
| `deleteParticipant(codigo)` | Elimina solo participantes sin capturas; no altera la secuencia ni las capturas. |

Todas las operaciones inicializan la base cuando es necesario. Una única promesa comparte la inicialización concurrente; se recupera la conexión existente y se comprueba la consistencia con el plugin. Un fallo de inicialización permite reintentar. Las operaciones se encolan para evitar transacciones superpuestas, y una operación fallida no bloquea las siguientes. Los errores incluyen contexto y conservan la causa original.

La conexión permanece abierta durante la sesión; cada escritura se confirma mediante la transacción del plugin. La persistencia no depende de ejecutar código al cerrar la aplicación. Android conserva el archivo en el almacenamiento privado de la app. Borrar datos o desinstalar la app elimina esa persistencia.

## Sincronización y eliminación de registros

- `getRecordSummaries(tipo)` devuelve todos los resúmenes del tipo; `RecordsSyncView` filtra los pendientes para sus tarjetas y contador. Los sincronizados se conservan en SQLite, aunque desaparecen de esta vista.
- `sincronizarRegistro(tipo, idLocal)` recupera la captura completa por UUID y verifica tipo/estado; `sincronizarPendientes(tipo)` consulta exclusivamente los pendientes del módulo y envía los elegibles en lotes secuenciales de hasta cinco.
- `src/services/sync.ts` transforma el UUID local `id` en `id_local` sin cambiar su valor; omite campos locales como `estado_sync`. Conserva fecha, métricas y todas las mediciones. Entrenamiento exige actividad y participante P-001 a P-999; Predicción envía actividad null y omite participante.
- Solo resultados `guardado` o `existente` con UUID correlacionado e `id_mongo` válido permiten llamar a `markAsSynced`. HTTP 200 por sí solo no confirma todos los registros.
- Los fallidos, omitidos y errores de marcado local permanecen pendientes. Una respuesta parcial válida permite continuar; red o respuesta inválida detienen los lotes restantes. El reintento manual conserva UUID para idempotencia.
- El hook confirma la eliminación con `window.confirm`. Cancelar no borra. El servicio comprueba el estado al ejecutar `DELETE FROM registros WHERE id = ? AND tipo = ? AND estado_sync = ?`, con `pendiente` como valor, y exige una fila afectada. Las mediciones se eliminan junto con su fila; no hay borrado HTTP ni de participantes.
- `recordOperations.ts` proporciona exclusión mutua para envíos y eliminación en ambos módulos, distinta de la cola de operaciones SQLite. El servicio de sincronización mantiene el bloqueo hasta finalizar las peticiones nativas, incluso después de un timeout de interfaz. La cola SQLite continúa serializando las lecturas/escrituras locales.

**Limitación conocida:** una fila corrupta puede interrumpir la consulta del módulo al deserializar/validar, antes de separar elegibles. El filtro por tipo evita leer filas del otro módulo, pero no aísla errores entre filas del mismo módulo. Los históricos legibles sin participante sí se omiten y permiten enviar los otros válidos. No se corrigen ni completan datos automáticamente.

El contrato HTTP consumido por el frontend se documenta en [UI_ARCHITECTURE.md](UI_ARCHITECTURE.md#9-contrato-http-consumido-y-flujo-de-sincronización).

## Configuración Android

El proyecto ya tiene SDK mínimo 24, SDK de compilación/objetivo 36, Java 21 y Android Gradle Plugin 8.13.2. Se revisó el Gradle del plugin instalado, que usa SDK 24/36 y Java 21. No se modificaron archivos nativos ni se requieren permisos de almacenamiento para la base privada.

Ejecutar `npx cap sync android` para registrar el plugin instalado y copiar el build web. No editar manualmente `capacitor.build.gradle` ni otros archivos generados. No se configura SQLite web en esta etapa: la persistencia nativa requiere Android.

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

## Validación de persistencia en Android

La integración fue validada por el usuario en un dispositivo Android real:

1. Entrenamiento y Predicción capturaron 10 segundos tras 3 segundos de preparación.
2. Cada captura se guardó automáticamente con UUID, fecha, tipo, actividad y estado pendiente.
3. Los listados Sincronizar mostraron los resúmenes por tipo y la cantidad de mediciones.
4. Los registros persistieron tras cerrar y reabrir la aplicación.
5. Los registros se conservaron sin conexión a internet.
6. En esa validación histórica (3.9), no se modificó el esquema, no se borraron registros y aún no se implementaba sincronización remota.

La interfaz ya no incluye la sección temporal de prueba con datos sintéticos; fue retirada y eliminada en 3.9-A. Desde las fases 5-D, `markAsSynced` se utiliza tras confirmación remota válida. El usuario confirmó posteriormente la sincronización de ambos módulos en Xiaomi 11T y el almacenamiento en MongoDB; no se atribuyen resultados individuales adicionales a esa confirmación global.

## Interfaz y validación de participantes

El selector aprobado utiliza una fila horizontal con desplegable nativo y dos botones de iconos (+ y papelera). Las confirmaciones de creación y eliminación continúan mediante `window.confirm`; se conservan los mensajes y el reintento existentes, sin notificaciones toast por ahora.

**Fase 5-B completada y validada por el usuario.** Procedimiento de los doce casos: [PARTICIPANTS_VALIDATION.md](PARTICIPANTS_VALIDATION.md), conservado como referencia sin marcar como ejecutados casos individuales no confirmados. Conectividad y sincronización HTTP quedaron validadas posteriormente en 5-C a 5-D.3. Las siguientes tareas pendientes corresponden al dataset definitivo, Machine Learning e inferencia.
