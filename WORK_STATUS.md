# WORK_STATUS — ML Sensores

## Estado general

**Etapa actual:** Fase 5-D.3 — Sincronización de Entrenamiento completada y validada por el usuario en Android. La integración con FastAPI y MongoDB está operativa para ambos módulos.

**Estado de la tarea:** Fases 5-C, 5-D.1, 5-D.2, 5-D.2-B y 5-D.3 completadas y validadas en Android. El usuario confirmó typecheck, lint y build satisfactorios, sincronización de Entrenamiento y Predicción en Xiaomi 11T y almacenamiento en MongoDB verificado. Las fases anteriores 5-D.1, 5-D.2 y 5-D.2-B fueron guardadas mediante commit por el usuario, según su confirmación previa.

**Corrección UI actual:** Correcciones 2-A (Sidebar inicial) y 2-B (Atrás de Android) completadas y validadas en Xiaomi 11T. El Test API permanece pendiente: actualmente es solo visual y está deshabilitado.

**Siguiente acción:** continuar con la recolección del dataset definitivo y el trabajo en Python/Jupyter. La implementación del Sidebar no modifica captura, SQLite, sensores ni sincronización; el Test API sigue pendiente y deshabilitado.

### Frontend actual

- React + TypeScript + Capacitor Android.
- Captura de acelerómetro y giroscopio para registros de Entrenamiento y Predicción.
- Gestión de participantes y persistencia local SQLite.
- Orientación vertical bloqueada de forma nativa en `AndroidManifest.xml`; validada por el usuario en Xiaomi 11T.
- Sidebar inicial implementado y validado en Android; el Test API permanece pendiente, exclusivamente visual y deshabilitado.
- El evento Atrás de Android cierra el Sidebar cuando está abierto; con el Sidebar cerrado se conserva la navegación existente. Implementado y validado en Android.

### Sincronización actual

- API FastAPI desplegada en Render (`https://ml-sensores-api.onrender.com`), conexión HTTPS validada en Android y MongoDB como almacenamiento central.
- Sincronización manual individual y masiva para ambos módulos, con un mismo endpoint POST por módulo: `/entrenamiento` y `/prediccion`.
- Envío masivo automático en lotes secuenciales de hasta cinco registros por pulsación.
- UUID local conservado para correlación e idempotencia; actualización del estado SQLite únicamente tras confirmación válida de `guardado` o `existente`.
- Eliminación individual local restringida a registros pendientes, con confirmación del usuario; no elimina documentos de MongoDB.
- Bloqueo compartido entre envíos individuales, masivos y eliminación, con protección ante desmontaje y peticiones nativas en curso.
- Manejo de errores, registros omitidos y respuestas parciales: los no confirmados permanecen pendientes; una respuesta parcial válida permite continuar, mientras que errores de red o respuestas inválidas detienen los siguientes lotes.

### Validación actual confirmada por el usuario

- `npm run typecheck`, `npm run lint` y `npm run build`: satisfactorios.
- Sincronización de Entrenamiento y Predicción probada en Xiaomi 11T.
- Almacenamiento de registros en MongoDB verificado.
- Orientación vertical bloqueada validada en Xiaomi 11T.
- Sidebar inicial y Atrás de Android: Correcciones 2-A y 2-B validadas satisfactoriamente en Xiaomi 11T.
- Fase 5-D.3 validada y cerrada. No se añaden fechas, versiones ni resultados individuales de pruebas no informados.

### Pendientes actuales

- Test API funcional; actualmente es solo visual y está deshabilitado.
- Recolección del dataset definitivo.
- Preparación y análisis del dataset en Python/Jupyter.
- Entrenamiento y evaluación del modelo.
- Flujo de inferencia mediante registros de Predicción; la captura y sincronización de esos registros ya están disponibles.

### Limitación conocida

Un registro SQLite corrupto podría interrumpir la consulta del módulo durante la deserialización o validación, antes de separar los registros elegibles. Los históricos legibles de Entrenamiento sin participante se omiten sin alterar sus datos y permiten enviar los demás válidos.

> Nota: las referencias a `DatabaseTest` y `CaptureTest` en secciones históricas describen etapas anteriores. Ambos componentes fueron eliminados en la tarea 3.9-A y no forman parte del estado actual.

Las descripciones de restricciones y funcionalidades aún pendientes dentro de etapas anteriores corresponden a ese momento histórico; el estado vigente es el resumen anterior, la corrección UI actual y el cierre de 5-D.3.

## Trabajo completado

### Corrección 1 — Orientación vertical (completada y validada en Android)

- `android/app/src/main/AndroidManifest.xml`: añadido `android:screenOrientation="portrait"` a la actividad principal `.MainActivity`.
- Se conserva `android:configChanges` y el resto de la configuración nativa. No se modificó `MainActivity.java`, Capacitor, sensores, SQLite, FastAPI ni MongoDB.
- Validación confirmada por el usuario en Xiaomi 11T: la aplicación permanece vertical al girar el dispositivo. La corrección queda completada y validada.

### Corrección 2-A — Sidebar inicial (completada y validada en Android)

- `src/shared/Sidebar.tsx`: drawer lateral con overlay, cierre por fondo/Escape, gestión de foco, encabezado con icono y «ML Sensores», divisoria, Test API visual deshabilitado y créditos al pie.
- `src/shared/Header.tsx`: el icono decorativo pasa a botón cuadrado que abre el Sidebar, con `aria-expanded`, `aria-controls` y animación sutil de borde.
- `src/layouts/AppLayout.tsx`: estado abierto/cerrado y renderizado del Sidebar; no se alteran rutas, captura, SQLite, sensores ni sincronización.
- `src/index.css`: estilos responsive, overlay, transición horizontal, áreas seguras, foco visible y soporte de movimiento reducido.
- El Test API permanece pendiente: es solo visual y está deshabilitado; no ejecuta HTTP ni usa `/openapi.json`. No se añadió el segundo botón ni navegación a todos los registros. Sin selector de tema, dependencias ni commits.
- Validación física completada en Xiaomi 11T: apertura, diseño, cierre con X, cierre al tocar fuera (overlay), transición, foco, áreas seguras, créditos y ausencia de desbordamiento.
- Validación final completada en Xiaomi 11T, incluyendo el cierre con Atrás de Android.

### Corrección 2-B — Atrás de Android en Sidebar (completada y validada en Android)

- `src/hooks/useAndroidBackNavigation.ts`: añade un interceptor opcional antes de navegar; si devuelve `true`, consume Atrás y evita `navigate(-1)` o `exitApp`. Conserva un único listener, la bandera `active` y la limpieza asíncrona al desmontar.
- `src/layouts/AppLayout.tsx`: el interceptor cierra el Sidebar solo cuando está abierto y devuelve `true`; si está cerrado, devuelve `false` y mantiene la navegación existente.
- No se modifica el historial, las rutas, el Sidebar, el Header, Test API, SQLite, sensores, sincronización, FastAPI ni MongoDB. Sin dependencias nuevas ni commits.
- Validación física completada en Xiaomi 11T con botón y gesto Atrás en Entrenamiento y Predicción; X, overlay, Escape y Atrás con el Sidebar cerrado confirmados.

### Fase 5-D.3 — Completada y validada en Android

- `src/hooks/useRecordSync.ts`: retirada la restricción `tipo !== "prediccion"`; conserva bloqueo local/global, protección al desmontar y refresco tras la operación.
- `src/components/records/RecordsSyncView.tsx`: Entrenamiento disponible para nube individual y botón masivo fijo; retirada la nota de siguiente fase. Detalle desplegable con UUID y motivo para entrenamientos omitidos, reutilizando `resumen.omitidos`.
- Servicio reutilizado sin duplicaciones ni cambios: `sincronizarRegistro("entrenamiento", idLocal)` / `sincronizarPendientes("entrenamiento")`, `validarElegibilidadLocal`, `transformarEntrenamiento`, `construirLotes`, `validarYCorrelacionarRespuesta` y `markAsSynced`.
- Payload verificado estáticamente: `id_local` original, tipo literal, actividad permitida, participante P-001 a P-999 (regla existente), fecha válida, métricas positivas finitas y todas las muestras con tiempo no negativo y seis ejes finitos. Construcción explícita sin `id`, `estado_sync` ni campos adicionales; no transforma valores de muestras.
- Se mantiene `conBloqueoRegistros` para ambos módulos y eliminación, incluida la espera de finalización HTTP nativa tras timeout. Solo confirmaciones válidas guardado/existente permiten marcar; fallidos permanecen pendientes y una respuesta parcial válida permite continuar; red/respuesta inválida detienen los siguientes lotes.
- Históricos sin participante se omiten, permanecen pendientes y no bloquean otros registros elegibles. Limitación existente: errores de deserialización/validación SQLite pueden abortar toda la lectura del tipo solicitado, antes de separar elegibles; se informa el error sin modificar datos.
- Predicción conserva su diseño y flujo. Sin cambios en SQLite, sensores, participantes, backend, estilos, dependencias ni UUID. Sin commits/push del agente.

**Verificación realizada:** revisión estática del flujo tarjeta/botón → hook → servicio → SQL, contrato y bloqueo. No se ejecutaron comandos ni POST reales.

**Validación posterior confirmada por el usuario:** typecheck, lint y build satisfactorios; sincronización de Entrenamiento y Predicción probada en Xiaomi 11T y almacenamiento en MongoDB verificado. La Fase 5-D.3 queda completada y validada en Android.

**Referencia para regresión:** individual; más de cinco entrenamientos con una sola pulsación; actividad/participante y número de muestras; guardado/existente/fallido; red/timeout; históricos e inválidos; SQLite/contador; eliminación; Predicción; navegación, bloqueo entre módulos y persistencia tras reiniciar. Se conserva este listado como referencia, sin atribuir resultados individuales no detallados por el usuario.

### Fase 5-D.2-B — Completada y validada en Android

- Nuevo `src/services/recordOperations.ts`: exclusión mutua observable por `useSyncExternalStore`; rechaza operaciones concurrentes y libera en `finally`. Envíos retienen el bloqueo hasta terminar la petición nativa incluso tras un timeout de interfaz.
- `sync.ts`: `sincronizarRegistro(tipo, idLocal)` consulta el registro completo, comprueba tipo y estado, y reutiliza elegibilidad, transformación, validación de respuesta y marcado del mismo procesador que la sincronización masiva. Envía un único elemento; la masiva mantiene lotes de cinco.
- `database.ts`: no existía eliminación reutilizable de capturas. `deletePendingRecord` usa el bloqueo común y un DELETE atómico condicionado por UUID, tipo y estado pendiente; exige una fila afectada, sin deserializar las muestras ni modificar el esquema.
- `useRecordSync.ts`: confirmación explícita con UUID y mediciones; cancelar no elimina ni refresca. Maneja errores, bloqueo síncrono y desmontaje. El estado global deshabilita acciones también al regresar durante un envío y dispara refresco cuando termina.
- `RecordCard`, `RecordList`, `RecordsSyncView` e `index.css`: acciones opcionales con nube/subida y papelera accesibles en grid junto al estado. Solo Sincronizar suministra estas acciones. Resumen muestra pendientes restantes consultados en SQLite, no solo los del envío individual.
- Predicción permite envío individual/masivo y eliminación. Entrenamiento permite eliminación; el hook y los botones mantienen HTTP deshabilitado.
- Se conserva `AppLayout` y su portal de barra fija. Estilos usan los tokens existentes (el proyecto actualmente define tema claro).

**Revisión realizada:** inspección estática de imports, consultas SQL, bloqueo compartido, rutas de error y consumidores de componentes. Sin comandos, POST reales, instalaciones ni cambios en backend/sensores.

**Validación confirmada por el usuario:** fase probada en Xiaomi 11T y guardada mediante commit. Los casos de respuestas, red, eliminación, concurrencia, navegación y alineación quedan como referencia de regresión; no se inventan resultados individuales no detallados. El HTTP de Entrenamiento deshabilitado descrito arriba corresponde a esta etapa histórica, habilitado ahora en 5-D.3.

### Fase 5-D.2 — Completada y validada por el usuario en Xiaomi 11T

- `src/services/database.ts`: `getPendingRecords(tipo?)` acepta un filtro opcional y lo aplica en la cláusula SQL antes de deserializar `mediciones`. Sin argumento conserva el comportamiento anterior.
- `src/services/sync.ts`: la sincronización consulta solo el tipo solicitado, de modo que una fila corrupta de Entrenamiento no bloquea los pendientes de Predicción, ni viceversa.
- `src/hooks/useRecordSync.ts`: hook reutilizable con bloqueo síncrono de dobles pulsaciones, estado de procesamiento, resumen, error y refresco final. No actualiza estado React después de desmontar; el servicio continúa confirmando en SQLite aunque el usuario navegue.
- `src/components/records/RecordsSyncView.tsx`: muestra únicamente `estado_sync === "pendiente"` del tipo actual, reutiliza `RecordList`/`RecordCard`, muestra contador, carga, vacío, error con reintento y un resumen que separa confirmados por el servidor, guardados, existentes, fallidos, omitidos y pendientes restantes.
- Predicción usa `sincronizarPendientes("prediccion")` y `POST /prediccion` en lotes secuenciales de cinco. Entrenamiento conserva la estructura visual con la acción deshabilitada y la nota de próxima fase.
- `src/layouts/AppLayout.tsx` y `src/index.css`: el layout pasa a una estructura de altura completa con contenido central desplazable y navegación inferior fija. La vista monta su barra de acción en un contenedor dedicado entre el contenido y la navegación mediante un portal de React, sin posiciones absolutas ni superposición; el contenedor se oculta cuando está vacío.
- No se modificó el esquema SQLite, no se instalaron dependencias, no se alteró la captura de sensores, no se eliminaron registros ni se cambiaron UUID. No se ejecutaron peticiones POST reales ni comandos de terminal.

**Validación confirmada por el usuario:** Fase 5-D.2 probada exitosamente en Xiaomi 11T y guardada mediante commit. La lista de escenarios de esta etapa se conserva como referencia de regresión.

**Comandos de referencia para la validación**, desde `ml-sensores/`, continuando solo si cada paso termina correctamente:

```bash
npm run typecheck
npm run lint
npm run build
npx cap sync android
npx cap open android
```

Las pruebas de integración posteriores fueron realizadas por el usuario en Xiaomi 11T, con almacenamiento en MongoDB verificado al cerrar 5-D.3; el agente no ejecutó POST reales durante la implementación.

### Fase 5-D.1 — Completada y validada en Android por el usuario

- `src/types/sync.ts` y `src/services/sync.ts`: contrato, elegibilidad local, transformación explícita, lotes de cinco, correlación por UUID canónico, validación de contadores, confirmaciones y bloqueo de sincronizaciones concurrentes.
- Reenvío idempotente conservando los UUID; solo se marcan `guardado` y `existente` con `id_mongo` válido. Sin interfaz ni peticiones reales durante la implementación.
- El usuario confirmó typecheck, lint y build correctos y validación del núcleo en Android como parte del flujo de sincronización en Xiaomi 11T.

### Fase 5-C — Completada y validada en Android por el usuario

- `.env.example` y `src/config/api.ts`: URL base `https://ml-sensores-api.onrender.com`, configurable con `VITE_API_BASE_URL` y usada por defecto si la variable no existe. Validación HTTPS sin credenciales, query ni fragmentos; construcción de rutas con `URL`.
- `src/services/api.ts`: solicitudes explícitas de `CapacitorHttp`, estructura GET/POST reutilizable sin consumidores de sincronización. No activa el parche global de fetch. Tras retirar el diagnóstico, la comprobación GET ya no está conectada a la interfaz.
- `checkApiConnectivity()`: requiere HTTP 200, JSON, campos básicos OpenAPI 3 (`openapi`, `info`, `paths`) y las operaciones GET/POST de entrenamiento y predicción, más GET por ID. Es una validación estructural acotada, no un validador completo de la especificación OpenAPI.
- Medición con `performance.now()` hasta la recepción de la respuesta, antes de validarla. Errores HTTP incluyen código; errores de red y timeout muestran descripción, sin exponer el documento completo.
- Se conservan el límite de espera de 60 segundos y los timeouts de conexión/lectura nativos de 60 segundos. Se deshabilitan redirecciones automáticas. En web se utiliza AbortController; la API nativa no ofrece cancelación directa. El servicio conserva el bloqueo de nuevas solicitudes mientras la operación nativa siga pendiente.
- `src/hooks/useApiConnectivity.ts`: eliminado tras confirmar que el header era su único consumidor. Las alertas del diagnóstico temporal ya no forman parte de la interfaz.
- `src/shared/Header.tsx` y `src/index.css`: retirados únicamente el botón de conexión y su clase exclusiva `.app-header__connection`; se conservan el título, la marca y los demás elementos del encabezado.
- Sin cambios en SQLite, participantes, sensores, configuración nativa o backend. No se instalaron dependencias ni se hicieron peticiones al servidor durante la implementación.

**Validación confirmada por el usuario:** Xiaomi 11T, servidor Render, URL `https://ml-sensores-api.onrender.com`, respuesta HTTP 200, rutas esperadas verificadas, tiempo **32669 ms**. Confirma comunicación Android → FastAPI por HTTPS mediante CapacitorHttp. La Fase 5-C queda completada.

**Revisión del cierre:** limpieza del header y búsqueda estática de consumidores del hook y estilos exclusivos. El agente no ejecutó comandos ni pruebas; no se atribuyen resultados de compilación posteriores a esta limpieza.

**Comandos de referencia para verificar la limpieza**, desde `ml-sensores/`, continuando solo si cada paso termina correctamente:

```bash
npm run typecheck
npm run lint
npm run build
npx cap sync android
npx cap open android
```

La URL predeterminada permite probar sin crear `.env`; para cambiarla, usar `.env.example` como plantilla y recompilar. Las variables `VITE_*` son públicas, no deben contener secretos.

**Alcance de la confirmación:** se registra la prueba exitosa de conectividad reportada. No se dan por ejecutadas individualmente pruebas de modo avión, recuperación de conexión, pulsaciones repetidas, timeout o comparación Wi-Fi/datos móviles. El botón usado para la prueba ya fue retirado; la configuración, el servicio y `.env.example` se conservan sin cambios en este cierre.

**Limitaciones:** CORS aplica al navegador, no al transporte HTTP nativo de Android. Un servicio Render suspendido puede demorar la primera respuesta. La consulta OpenAPI verifica conectividad y estructura publicada, no el funcionamiento de MongoDB ni una validación exhaustiva del documento. La sincronización queda pendiente de una tarea posterior.

### Fase 5-B — Completada y validada por el usuario

- `src/services/database.ts`: migración transaccional explícita desde `user_version` 0/1 a 2; tabla `participantes`, referencia nullable en registros, índice y triggers. La migración no cambia UUID, sensores ni estados; las capturas históricas conservan NULL.
- Códigos P-001 a P-999 mediante AUTOINCREMENT y `sqlite_sequence`, sin reutilización al eliminar. Vista previa sin reserva y asignación definitiva en una sola sentencia de inserción. Límite de tres dígitos para compatibilidad con FastAPI.
- Operaciones `getParticipants`, `getNextParticipantCode`, `createParticipant` y `deleteParticipant`, reutilizando la conexión y cola existentes. Eliminación condicionada a ausencia de capturas y FK `ON DELETE RESTRICT`.
- `src/hooks/useParticipants.ts` y `ParticipantSelector.tsx`: consulta, selección, alta/baja con confirmación, estados de error/vacío y bloqueo de operaciones repetidas.
- `TrainingPage.tsx`: no inicia sin participante; fija participante y actividad al iniciar. `useCaptureSave` conserva ambos, junto con el UUID, para el guardado y reintento. No incluye `participante_id` en objetos de predicción.
- `RecordCard.tsx`: muestra participante en entrenamiento o identifica una captura histórica sin participante.
- Se conserva `useSensorCapture.ts`, la duración de captura y el módulo de predicción. No hay nuevas dependencias ni cambios en el backend.

**Verificación del agente durante la implementación:** revisión estática de los cambios y de las firmas/implementación del plugin SQLite instalado, incluida su separación de sentencias y manejo de triggers. El agente no ejecutó comandos ni pruebas.

**Validación confirmada por el usuario:** typecheck, lint y build correctos; aplicación compilada y ejecutada en Xiaomi 11T; gestión de participantes funcionando y selector rediseñado probado y aprobado. La Fase 5-B queda cerrada. No se atribuye ejecución individual a los doce casos de `docs/PARTICIPANTS_VALIDATION.md` ni una comprobación específica de migración sobre datos antiguos sin resultados detallados.

**Diseño y mensajes aprobados:** selector horizontal con un desplegable nativo y dos botones de iconos (+ y papelera), ubicado entre `CaptureClock` y `ActivitySelector`. Las confirmaciones de agregar y eliminar continúan usando `window.confirm`. Se mantienen los mensajes y el reintento existentes; no se implementarán notificaciones toast por ahora.

### Histórico de fases anteriores

- Proyecto inicial creado con React y Vite.
- Capacitor configurado para Android.
- Aplicación ejecutada en Xiaomi 11T.
- Acceso funcional a acelerómetro y velocidad de rotación mediante `devicemotion`.
- Prueba de captura de 10 segundos completada.
- 601 mediciones recibidas y válidas.
- Frecuencia promedio observada: 60.09 Hz.
- Repositorio GitHub inicial publicado.
- Migración de `src/App.jsx`, `src/main.jsx` y `vite.config.js` a TSX/TypeScript.
- Tipos `MedicionSensor`, `ResultadoCaptura` y `EstadoCaptura` en `src/types/sensores.ts`.
- Estados, referencias, eventos `DeviceMotionEvent` y temporizadores del navegador tipados, con comprobaciones de valores nulos.
- TypeScript estricto configurado para la aplicación y Vite, sin `any` ni supresiones de comprobaciones.
- Comando `npm run typecheck` e integración de la verificación de tipos en `npm run build`.
- ESLint adaptado a TypeScript, excluyendo assets generados y compilaciones de Android.
- Tarea 3.1 completada: lógica de captura separada de `App.tsx` en el hook reutilizable `src/hooks/useSensorCapture.ts`, con funcionamiento validado por el usuario.
- Tarea 3.2 completada: navegación entre las cuatro rutas y pruebas existentes validadas por el usuario tanto en navegador como en Android.
- Tarea 3.3 completada: tema visual claro validado por el usuario; commit de la implementación realizado por el usuario según su confirmación.
- Tarea 3.4 completada: componentes reutilizables de captura validados por el usuario en navegador y Android, con reloj circular aprobado, selector de actividad mediante botones, captura funcional en ambos módulos y pruebas de SQLite conservadas.
- Tarea 3.5 completada: preparación de 3 segundos antes de la captura real de 10 segundos en Entrenamiento y Predicción, validada por el usuario. Durante la preparación no se toman mediciones; la cancelación, limpieza y reutilización funcionan correctamente.
- Tarea 3.6 completada: guardado automático de capturas de Entrenamiento en SQLite validado por el usuario en Android, con UUID por registro, recuperación de aproximadamente 600 mediciones y persistencia tras reiniciar. Predicción no presentó regresiones.
- Tarea 3.7 completada: guardado automático de capturas de Predicción en SQLite validado por el usuario en Android, con hook compartido `useCaptureSave`, UUID por registro, tipo `prediccion`, actividad `null`, estado pendiente, persistencia y recuperación de aproximadamente 600 mediciones. La regresión de Entrenamiento fue superada.
- Tarea 3.8 completada: listado local por tipo en las vistas Sincronizar validado por el usuario en Android, con resúmenes SQLite mediante `getRecordSummaries`, tarjetas, consulta automática, estados de carga/vacío/error y reintento. Se confirmó `json_array_length()`, la persistencia, la navegación y la ausencia de cambios en `estado_sync` o sincronización remota; se eliminó el botón «Actualizar listado» conservando «Reintentar».
- Tarea 3.9 completada: limpieza 3.9-A y validación integral 3.9-B en Android. Se eliminaron `DatabaseTest`, `CaptureTest`, sus estilos exclusivos y `App.css`; se confirmó el flujo completo de ambos módulos, la persistencia, la navegación y el funcionamiento sin internet, conservando los registros y sin modificar el esquema SQLite ni implementar sincronización remota.

## Verificación de la migración (2026-11-04)

- `npm run typecheck`: correcto para la aplicación y la configuración de Vite.
- `npm run lint`: correcto. Se excluyeron archivos generados de Android y se declaró `detener` antes de `iniciar` para resolver el diagnóstico de pureza de React Hooks, sin cambiar sus operaciones.
- `npm run build`: correcto; genera la aplicación web en `dist/`.
- Dependencias de desarrollo añadidas: `typescript`, `@types/node` y `typescript-eslint`. Los tipos de React y React DOM ya estaban instalados.
- Se conservan la duración objetivo de 10 segundos, el intervalo de comprobación de 100 ms, la validación de los seis valores finitos y el cálculo de frecuencia como total / duración real.
- La interfaz y los estilos se conservan. La carpeta nativa `android/` no se modificó.
- La instalación informó 12 vulnerabilidades moderadas; no se aplicaron actualizaciones ajenas a la migración.
- Migración validada en Xiaomi 11T según confirmación del usuario. Los 601 registros y 60.09 Hz documentados corresponden a la prueba de referencia anterior.

## Integración inicial de SQLite — validada

- Diseño aprobado documentado en `docs/SQLITE_DESIGN.md`.
- Versiones instaladas revisadas: Capacitor Core/Android/CLI 8.6.0 y `@capacitor-community/sqlite` 8.1.1.
- Tipos `Actividad`, `TipoRegistro`, `EstadoSync`, `Medicion`, `Registro` y `RegistroResumen` en `src/types/records.ts`, reutilizando `MedicionCompleta`.
- Servicio `src/services/database.ts`: base `ml_sensores`, versión 1, tabla `registros` y su índice con el esquema aprobado.
- Funciones implementadas: `initializeDatabase`, `saveRecord`, `getRecords`, `getRecordSummaries`, `getPendingRecords`, `getRecordById` y `markAsSynced`.
- Inicialización compartida, recuperación de conexión y operaciones encoladas para evitar aperturas duplicadas y transacciones superpuestas.
- Consultas parametrizadas; validación de UUID, fecha ISO UTC, tipo/actividad, duración/frecuencia positivas, estado pendiente y seis lecturas finitas por medición. Serialización/deserialización JSON con validación de filas recuperadas.
- La sección temporal `src/components/DatabaseTest.tsx` se utilizó durante la integración inicial para guardar datos sintéticos, consultar registros y comprobar la igualdad de las mediciones tras guardar y recuperar. Fue retirada de la interfaz y eliminada en la tarea 3.9-A.
- La lógica de captura de sensores se conserva; la interfaz actual no incluye pruebas temporales de SQLite.
- La implementación del agente no requirió modificaciones nativas de Android.
- Integración y persistencia en Android validadas según confirmación del usuario. Las verificaciones fueron responsabilidad del usuario; el agente no ejecutó comandos de instalación, tipos, lint, build, sincronización, pruebas ni Git en esta etapa.

## Decisiones aprobadas

- React + TypeScript.
- Capacitor para Android.
- SQLite como almacenamiento local.
- FastAPI como backend.
- MongoDB Atlas como base de datos remota.
- Sincronización manual de registros.
- Un mismo endpoint POST por módulo para envío individual y masivo, mediante el arreglo `registros`.
- Lotes secuenciales de hasta cinco registros para el envío masivo.
- UUID local conservado para correlación e idempotencia; no se generan UUID nuevos al reenviar.
- Eliminación local restringida a registros pendientes, con confirmación explícita y comprobación del estado en SQL.
- Clasificación de quieto, caminando y corriendo.
- Procesamiento y predicción desde Python/Jupyter.

### Arquitectura aprobada de Fase 3

- Documento de referencia: `docs/UI_ARCHITECTURE.md`, con inventario del código existente, responsabilidades, estructura progresiva y diagrama Mermaid de navegación.
- Dos páginas principales: `TrainingPage` y `PredictionPage`; cada una tiene vistas internas Captura y Sincronizar.
- React Router con cuatro rutas: `/entrenamiento`, `/entrenamiento/sincronizar`, `/prediccion`, `/prediccion/sincronizar`. `App.tsx` declara las rutas permitidas y la redirección de `/` y rutas desconocidas a `/entrenamiento`; navegación validada por el usuario en la tarea 3.2.
- `AppLayout` compartido: encabezado, navegación inferior y espacio para la vista activa. La ruta determinará la vista seleccionada.
- Organización por responsabilidades en `pages/`, `layouts/`, `shared/`, `components/capture/`, `components/records/`, `hooks/`, `services/` y `types/`, creada progresivamente.
- Reutilizar reloj, controles, tarjetas, listas, servicio SQLite y tipos actuales. Entrenamiento requiere actividad; predicción almacena `null`. Ambos capturan 10 segundos, generan UUID en el dispositivo y guardan localmente como pendientes.
- Lógica de sensores extraída de `App.tsx` a `useSensorCapture`, con conservación del funcionamiento validada por el usuario. La cuenta regresiva de 3 segundos fue añadida y validada en la tarea 3.5.
- Tema exclusivamente claro, sin modo oscuro ni selector de temas. Fuente oficial de colores, tipografía, espaciados y estilos: `docs/design/DESIGN.md`. Capturas de las cuatro vistas: `docs/design/references/`.
- En el cierre de Fase 3, las vistas Sincronizar mostraban los registros locales de su tipo; la sincronización manual real se añadió posteriormente en las fases 5-D.

### Estado real de Fase 3

- Arquitectura y tareas verificables documentadas; Fase 3 finalizada. Las dos páginas, las cuatro rutas, el tema claro, la captura, el guardado y los listados están implementados y validados.
- La captura permanece en `src/hooks/useSensorCapture.ts`. Las vistas Captura de Entrenamiento y Predicción consumen el hook mediante `CaptureClock`, `ActivitySelector` (solo entrenamiento), `CaptureControls` y `CaptureResult`; estos componentes fueron validados por el usuario en navegador y Android. `DatabaseTest` y `CaptureTest` fueron eliminados en 3.9-A, junto con `App.css` y los estilos exclusivos de las pruebas. No quedan pruebas temporales en la interfaz.
- `App.tsx` declara rutas y `main.tsx` configura `BrowserRouter`. La base visual compartida de 3.3, los componentes de captura de 3.4, la cuenta regresiva de 3.5, el guardado de 3.6 y 3.7 y los listados de 3.8 están completados y validados. La tarea 3.9 completó la limpieza y la validación integral en Android.
- Dependencias de navegación ya declaradas en `package.json`: `react-router-dom: ^7.18.5` y `@capacitor/app: ^8.1.2`. No se añadieron dependencias para el tema visual.
- La tarea 3.6 expone métricas numéricas y muestras completas, rechaza capturas incompletas, guarda automáticamente con UUID, fecha y actividad fijados, y muestra estados de guardado con reintento. La tarea 3.7 extrajo esa orquestación a `useCaptureSave`, la reutiliza en Entrenamiento y Predicción y guarda las capturas de Predicción con `tipo: prediccion` y `actividad: null`. La tarea 3.8 implementa el listado local por tipo con resúmenes SQLite, tarjetas, estados, consulta automática y reintento; está completada y validada en Android.
- La tarea 3.1 modificó hook, consumo en App y el tipo de resultado; el usuario confirmó que las pruebas funcionan correctamente. El agente no ejecutó comandos ni verificaciones de código en esa tarea.
- Sistema de Stitch y cuatro capturas disponibles y referenciados. Functional Palette tiene prioridad definitiva; se corrigieron en el YAML los tokens `background`, `surface`, `primary`, `on-background` y `on-surface`. Los roles adicionales sin equivalencia confirmada se conservan y se interpretarán solo si se utilizan, según la sección 6 de `docs/UI_ARCHITECTURE.md`. La base visual compartida está implementada y validada; las tareas 3.4 a 3.9 también están completadas y validadas. La Fase 3 quedó finalizada; la Fase 4 se completó posteriormente con las fases 5-B a 5-D.3.

## Validación completada

### Validación de SQLite en Android

**Resultado:** Validación confirmada por el usuario: guardado, recuperación por UUID y JSON, persistencia tras cerrar/reabrir y conservación de la captura de sensores.

**Comandos de referencia para futuras verificaciones (desde `ml-sensores/`):**
```bash
npm run typecheck
npm run lint
npm run build
npx cap sync android
npx cap open android
```

El procedimiento de referencia está en `docs/SQLITE_DESIGN.md`: prueba en modo avión, guardado y consulta por UUID, cierre y reapertura, revisión del JSON recuperado y captura de sensores de 10 segundos.

**Restricciones de la etapa SQLite ya completada:**
- No recrear el proyecto.
- No eliminar ni reinicializar Android.
- No avanzar a FastAPI, MongoDB ni pantallas definitivas.
- No modificar la funcionalidad de captura.

**Criterios de aceptación:**
Validación registrada según confirmación del usuario.

- [x] TypeScript, lint y build correctos después de integrar SQLite.
- [x] Base inicializada en Android y registro guardado.
- [x] Recuperación por UUID y mediciones JSON correctas.
- [x] Persistencia después de cerrar y reabrir, sin conexión.
- [x] Captura de sensores de 10 segundos conservada.

## Bloqueos

La discrepancia de precedencia de colores está resuelta: prevalece Functional Palette y las equivalencias claras del YAML están corregidas. No hay bloqueo por la paleta aprobada ni faltan el documento de Stitch o las cuatro capturas. Los tokens adicionales sin equivalencia confirmada requieren interpretación únicamente si se utilizan.

## Tarea 3.1 — Completada y validada por el usuario

- Creado `src/hooks/useSensorCapture.ts`: estados, eventos `devicemotion`, búfer de muestras, temporización y cálculo de resultados extraídos de App.
- Interfaz pública: `estado`, `segundos`, `resultado: ResultadoCaptura | null` e `iniciar(): void`. La finalización es automática; no se expone una acción de parada anticipada.
- Ampliación mínima de `ResultadoCaptura`: `mediciones: MedicionSensor[]`, instantánea completa al terminar (incluye muestras incompletas). Se limpia el resultado al iniciar otra sesión; no hay historial ni persistencia de capturas reales.
- Conservados 10000 ms objetivo, comprobación cada 100 ms, `performance.now()`, seis lecturas, validación finita, frecuencia total/duración real y formato de dos decimales.
- Inicios repetidos ignorados por una referencia de captura activa, antes del siguiente render. Cada sesión registra un listener y un intervalo; los renders no los duplican. Solo se monta una instancia en App.
- Al finalizar se retiran listener/intervalo y se limpian referencias temporales, conservando la instantánea del resultado. Al desmontar se descarta la captura activa sin publicar un resultado parcial ni actualizar estado. El efecto admite el ciclo de montaje/limpieza de StrictMode.
- Diferencia interna: antes el listener permanecía registrado mientras App estaba montado; ahora existe únicamente durante la sesión. Los tiempos y la presentación se conservan; el usuario confirmó que la captura sigue funcionando correctamente en Android.
- `database.ts`, `DatabaseTest.tsx`, estilos y Android no se modificaron. No se añadieron dependencias.

### Validación confirmada y referencia para futuras verificaciones

El usuario confirmó el funcionamiento correcto de las pruebas y el cierre de la tarea 3.1. Se conserva el siguiente procedimiento como referencia para futuras verificaciones, no como pendiente de esta tarea.

Comandos desde `ml-sensores/`, continuando solo si cada comando termina correctamente:

```bash
npm run typecheck
npm run lint
npm run build
npx cap sync android
npx cap open android
```

En Xiaomi 11T: iniciar y esperar aproximadamente 10 segundos; comprobar botón deshabilitado, estados, duración real, total, válidas/incompletas, frecuencia y primera/última medición. Repetir varias sesiones para comprobar el reinicio y que los resultados no sigan cambiando al finalizar. Verificar que pulsaciones rápidas no reinicien ni superpongan sesiones. Revisar la lista completa en el log existente «Mediciones capturadas» y su correspondencia con el total.

Revisar también el desmontaje durante una captura (mediante React DevTools o un consumidor temporal, ya retirado): no debe quedar listener/intervalo ni publicarse un resultado parcial. Cerrar/reabrir la aplicación sirve como prueba adicional de reinicio, pero no sustituye comprobar la limpieza del hook al desmontarse. La captura y el guardado SQLite se validaron posteriormente en 3.6 y 3.7. No se exige una cantidad fija de mediciones ni exactamente 60.09 Hz.

**La tarea 3.1 queda completada y validada según confirmación del usuario.** El agente solo realizó revisión estática; no ejecutó tipos, lint, build ni pruebas.

## Tarea 3.2 — Completada y validada por el usuario

### Cambios realizados

- `src/App.tsx`: las cuatro rutas aprobadas bajo `AppLayout`, con `Navigate replace` para `/` y rutas desconocidas. La redirección reemplaza la entrada inválida para evitar bucles al retroceder.
- `src/main.tsx`: `BrowserRouter` usa el historial del navegador y mantiene URLs sin fragmentos `#`.
- `src/pages/TrainingPage.tsx` y `src/pages/PredictionPage.tsx`: dos páginas con vistas internas determinadas mediante la ruta activa (`useMatch`); enlaces `NavLink` con coincidencia exacta para Captura/Sincronizar.
- `src/layouts/AppLayout.tsx`: Header, un único contenido principal con `Outlet` y BottomNavigation. No incluye sensores ni SQLite.
- `src/shared/Header.tsx`: nombre ML Sensores. `src/shared/BottomNavigation.tsx`: enlaces entre módulos y estado activo derivado de Router, incluso en las subrutas Sincronizar.
- `src/components/CaptureTest.tsx`: interfaz de la prueba anterior, trasladada desde App; mantiene botón, temporizador, métricas, primera/última medición y `DatabaseTest`. Adaptado su contenedor al tema claro y al contenido principal del layout.
- `src/hooks/useAndroidBackNavigation.ts`: escucha `backButton` de `@capacitor/app` solo en Android; usa `navigate(-1)` cuando `canGoBack` es verdadero y `App.exitApp()` cuando no hay historial. Libera únicamente su listener, incluso si el registro asíncrono termina después de la limpieza de StrictMode.
- `src/index.css`: estilos mínimos de layout, navegación activa/foco y legibilidad; eliminado el cambio automático a modo oscuro. Sin diseño completo de Stitch ni bibliotecas visuales.
- Las vistas Sincronizar y Captura de Predicción son provisionales con información de su estado pendiente. No implementan nuevas capturas, listados definitivos ni envío de registros.

### Conservación de la prueba y navegación durante captura

La prueba funcional solo se monta en `/entrenamiento`. Cambiar de vista o módulo desmonta `CaptureTest`: el hook validado retira listener/intervalo y descarta la captura temporal sin guardarla. Al volver, los estados de prueba empiezan de nuevo. El aviso aparece en la interfaz. Los registros ya guardados mediante `DatabaseTest` permanecen en SQLite; basta consultarlos otra vez al regresar.

No se modificaron `useSensorCapture.ts`, `database.ts`, `DatabaseTest.tsx` ni archivos nativos de Android. No se duplicó la lógica de captura ni se conectaron capturas reales con SQLite.

### Dependencias y comandos manuales

Dependencias incorporadas por el usuario: `react-router-dom` versión mayor 7 y `@capacitor/app` versión mayor 8, alineada con Capacitor 8. El plugin App se utiliza para el botón Atrás físico. No se requieren paquetes de tipos adicionales para Router.

Comandos de referencia de la tarea 3.2 (instalación ya realizada por el usuario; no es necesario repetirla para las tareas posteriores):

```bash
npm install react-router-dom@7 @capacitor/app@8
npm run typecheck
npm run lint
npm run build
```

Para validar navegación en navegador:

```bash
npm run dev
```

Para Android, después de compilar:

```bash
npx cap sync android
npx cap open android
```

La sincronización registra el plugin App y copia el build; no editar archivos nativos manualmente. El agente no ejecutó instalaciones, comandos de Git, tipos, lint, build ni pruebas; solo realizó revisión estática.

### Validación confirmada por el usuario

- [x] Navegación entre las cuatro rutas validada en navegador.
- [x] Navegación validada en Android.
- [x] Acceso y funcionamiento de las pruebas de sensores y SQLite conservados.

La confirmación corresponde al usuario; el agente no ejecutó las verificaciones. Los cambios visuales posteriores de 3.3 también fueron validados por el usuario.

Limitaciones: SQLite sigue requiriendo Android; navegador permite revisar navegación y estructura pero no valida persistencia nativa. `BrowserRouter` necesita que un alojamiento web de producción devuelva `index.html` para rutas de la SPA; Vite dispone de fallback durante desarrollo, y la recarga de subrutas en Capacitor debe verificarse en el dispositivo. La conexión del botón Atrás exige instalar y sincronizar `@capacitor/app`; cualquier fallo de registro se informa en consola.

**La tarea 3.2 queda completada en ROADMAP.md según confirmación del usuario.** La Fase 3 fue finalizada posteriormente en la tarea 3.9.

## Tarea 3.3 — Tema claro compartido completado y validado por el usuario

### Base visual

- `src/index.css`: centraliza la paleta oficial en `--color-background`, `--color-surface`, `--color-primary`, `--color-primary-soft`, `--color-text`, `--color-text-secondary` y `--color-on-primary`.
- Tokens complementarios tomados del cuerpo de DESIGN.md: borde `#DCE7DF`, hover primario `#0D532E`, colores de aviso, radios de controles de 4 px y tarjetas de 8 px, sombras sutiles y escala de espaciado de 2 a 48 px. No se reinterpretaron los tokens ambiguos del YAML.
- Tipografía: familias `Space Grotesk` para interfaz y `JetBrains Mono` para datos, con alternativas locales de sistema; tamaños responsivos y cifras tabulares en tiempo/JSON. No se añadieron fuentes remotas ni dependencias visuales.
- `AppLayout` recibe el estilo mediante sus clases existentes: fondo claro, contenido adaptable hasta 1440 px y barras sticky en el flujo del documento. Márgenes móviles de 16 px, tablet de 24 px y escritorio de 40 px.
- `Header`: identidad ML Sensores, marca SVG decorativa no interactiva, línea verde y separación consistente. Sin menú ficticio ni selector de temas.
- `BottomNavigation`: conserva los dos NavLink, sus rutas y estado activo; incorpora iconos SVG locales, etiquetas visibles y estilos de foco/hover/selección sin cambiar la lógica de navegación.
- Controles de vistas, botones, campos y superficies comparten estilos. Estados hover, active, focus-visible y disabled; objetivos táctiles mínimos de 44 px. Las transiciones y el escalado al pulsar se desactivan con reducción de movimiento.
- Vistas provisionales con `.surface-card` y texto secundario. `CaptureTest` usa las clases compartidas en lugar de estilos en línea para botón, resultados y JSON. El comportamiento de la prueba se conserva.
- `index.html`: idioma español y `viewport-fit=cover`; CSS contempla insets superior, inferior, izquierdo y derecho, y reserva de desplazamiento para el foco. No se deshabilita el zoom ni se modifican archivos nativos Android.

### Alcance y diferencias respecto a Stitch

- Se revisaron las cuatro capturas y sus HTML. La arquitectura aprobada conserva dos módulos inferiores y dos vistas internas; las referencias muestran cuatro accesos inferiores. No se agregaron rutas ni módulos para reproducir esa diferencia.
- Se sigue DESIGN.md para radios, espaciados y familias tipográficas, aunque algunos HTML usan Inter, radios mayores y otros márgenes. No se reproduce la barra ficticia de hora/batería ni el menú lateral de las capturas.
- Iconos SVG locales simplificados en lugar de Material Symbols descargado de Google. Sin Tailwind, librerías de componentes ni recursos visuales de red.
- No hay archivos de Space Grotesk ni JetBrains Mono empaquetados en el proyecto. Las familias están declaradas y se usarán si están instaladas; en Android normalmente se verán las alternativas del sistema. Para fidelidad tipográfica exacta offline faltan los archivos de fuente y su licencia para incorporarlos localmente en una tarea autorizada.
- Se mantienen las pruebas temporales y los textos provisionales. No se implementaron reloj circular, selector de actividad, controles definitivos, tarjetas/listas de registros, cuenta regresiva, guardado real ni sincronización.
- No se modificaron los hooks de captura/navegación, `database.ts`, `DatabaseTest.tsx`, el mapa de rutas ni dependencias. El CSS compartido sí estiliza los controles existentes de la prueba SQLite.

### Validación confirmada y referencia para futuras verificaciones

El usuario confirmó que el tema visual claro funciona correctamente y que realizó el commit de su implementación. La tarea 3.3 queda completada según esa confirmación. El agente no ejecutó instalaciones, compilación, lint, pruebas ni Git, ni consultó el commit.

Se conservan los comandos y el procedimiento siguientes como referencia de regresión para cambios futuros, no como pendientes del cierre de 3.3. Desde `ml-sensores/`:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

Para actualizar y probar Android después del build:

```bash
npx cap sync android
npx cap open android
```

- Verificar las cuatro rutas, redirecciones y navegación sin regresiones; comprobar Atrás en navegador y Android.
- Revisar colores, superficies, textos, botones y selección activa de las dos barras de navegación en todas las vistas.
- Revisar anchos de 320/360/390 px, tablet y escritorio; aumentar texto/zoom, comprobar que etiquetas, UUID y JSON no provocan desbordamiento de toda la página.
- Probar foco por teclado y controles habilitados/deshabilitados (captura y fieldset SQLite), hover en escritorio y pulsación en móvil.
- Comprobar que el tema permanece claro con la preferencia del sistema en oscuro y que reducción de movimiento elimina transiciones/escalado.
- En Xiaomi 11T, revisar áreas seguras, gestos/botones del sistema, orientación horizontal y campo UUID con el teclado abierto; ningún control debe quedar inaccesible.
- Repetir captura de 10 segundos y prueba SQLite en modo avión; comprobar legibilidad de resultados, consulta del UUID y persistencia.
- Validar visualmente las diferencias documentadas, especialmente las fuentes alternativas locales.

**3.3 queda completada y validada por el usuario.** La Fase 3 fue finalizada posteriormente en la tarea 3.9.

## Tarea 3.4 — Componentes reutilizables de captura completados y validados por el usuario

### Componentes creados

- `src/components/capture/CaptureClock.tsx`: temporizador circular de solo presentación. Recibe `estado`, `tiempoTranscurrido`, `progreso` y `duracionObjetivo`; dibuja el anillo SVG, el tiempo restante y el estado. No crea temporizadores ni accede a sensores.
- `src/components/capture/ActivitySelector.tsx`: grupo de radios semántico con las opciones `quieto`, `caminando` y `corriendo` del tipo `Actividad`. Recibe `value`, `onChange` y `disabled`; muestra la selección con estilos y no accede a SQLite ni a sensores.
- `src/components/capture/CaptureControls.tsx`: botón de inicio y mensaje de estado. Recibe `estado` y `onStart`; deshabilita el botón durante `Capturando...` para evitar inicios duplicados y no contiene lógica de sensores.
- `src/components/capture/CaptureResult.tsx`: resumen reutilizable de las métricas y del detalle de primera/última medición. Recibe `resultado`; no guarda registros ni consulta SQLite. Se añadió para compartir la presentación del resultado entre ambos módulos.

### Integración y conservación

- `TrainingPage.tsx`: la vista Captura monta una única instancia de `useSensorCapture` en un componente interno y conecta reloj, selector, controles y resultado. El selector inicia en `caminando` y se deshabilita durante la captura. El selector solo existe en Entrenamiento.
- `PredictionPage.tsx`: la vista Captura usa el mismo hook, reloj, controles y resultado, sin selector de actividad. La captura es real, pero no guarda registros en SQLite.
- El hook se monta únicamente en la vista Captura activa. Al cambiar a Sincronizar o a otro módulo, el componente se desmonta y el hook retira listener e intervalo; no se duplican suscripciones ni temporizadores.
- Las vistas Sincronizar permanecen provisionales y sin cambios funcionales.
- `DatabaseTest` se conserva sin modificar y sigue accesible dentro de un `<details>` en Captura de Entrenamiento. No se modificaron `src/services/database.ts`, su esquema ni sus funciones.
- Se mantienen la duración de 10 segundos, los seis ejes (`ax`, `ay`, `az`, `gx`, `gy`, `gz`), `tiempo_ms`, las mediciones completas y las métricas del resultado.
- No se implementaron cuenta regresiva de 3 segundos, guardado automático, tarjetas/listas definitivas, sincronización ni cambios de rutas. No se añadieron dependencias ni se modificaron archivos nativos de Android.
- `src/components/CaptureTest.tsx` ya no se monta en las páginas; se conserva el archivo como referencia y no se modificó.

### Estilos

- Se reutilizan las variables CSS existentes de `src/index.css` y la paleta clara de `docs/design/DESIGN.md`.
- Se añadieron estilos para el reloj, el anillo, el selector de actividad, los controles, el resultado y el bloque de prueba SQLite, con foco visible, objetivos táctiles y reducción de movimiento.
- No se añadió modo oscuro, Tailwind, Material Symbols ni librerías visuales.

### Validación confirmada por el usuario

El usuario confirmó que la tarea 3.4 funciona correctamente en navegador y Android. Aprobó explícitamente el reloj circular que comienza lleno y se vacía durante los 10 segundos, el selector de actividad mediante botones en lugar de un desplegable, la captura funcional en Entrenamiento y Predicción, y la conservación de las pruebas de SQLite. El agente no ejecutó instalaciones, compilación, lint, pruebas ni Git.

Se conservan los comandos siguientes como referencia de regresión para cambios futuros, no como pendientes de esta tarea. Desde `ml-sensores/`:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

Para Android, después del build:

```bash
npx cap sync android
npx cap open android
```

- [x] Entrenamiento con reloj, selector de actividad y controles; Predicción con reloj y controles sin selector.
- [x] Cuenta descendente, anillo que inicia lleno y se vacía, estado visible, botón deshabilitado y ausencia de inicios duplicados.
- [x] Captura de 10 segundos con seis ejes por medición, `tiempo_ms`, total, válidas, incompletas, frecuencia, primera/última medición y mediciones en memoria.
- [x] Cambio de vista o módulo durante una captura sin dejar una captura activa al volver.
- [x] Capturas repetidas sin superposición de resultados ni temporizadores.
- [x] Selector accesible y bloqueado durante la captura.
- [x] Prueba de SQLite conservada: inicializar, guardar y recuperar por UUID sin cambios en el servicio ni en el esquema.
- [x] Tema claro, anchos móviles, foco, áreas seguras y orientación horizontal revisados en navegador y Android.
- [x] Diferencias respecto a Stitch aceptadas: selector segmentado mediante botones, iconos SVG locales y fuentes alternativas locales.

**3.4 queda completada y validada por el usuario.** La Fase 3 fue finalizada posteriormente en la tarea 3.9.

## Tarea 3.5 — Cuenta regresiva de preparación de 3 segundos: completada y validada por el usuario

### Cambios realizados

- `src/types/sensores.ts`: `EstadoCaptura` incorpora `"Preparando..."` además de los estados existentes.
- `src/hooks/useSensorCapture.ts`:
  - Exporta `DURACION_CAPTURA_SEGUNDOS = 10` y `DURACION_PREPARACION_SEGUNDOS = 3`; la captura conserva su duración objetivo y la comprobación cada 100 ms.
  - `iniciar()` bloquea inicios duplicados, limpia el resultado anterior y arranca una cuenta de preparación de 3 segundos.
  - Durante la preparación no se registra el listener `devicemotion` ni se almacenan mediciones.
  - Al terminar la preparación, la captura de 10 segundos comienza automáticamente; el listener se registra solo en ese momento.
  - La preparación y la captura comparten una limpieza idempotente de intervalos, listener y referencias. Al desmontar se cancela cualquiera de las dos fases sin publicar un resultado parcial.
  - El resultado conserva las mediciones completas en `resultado.mediciones` y la duración registrada corresponde solo a los 10 segundos de captura.
- `src/components/capture/CaptureClock.tsx`: recibe `preparacionRestante` y `duracionPreparacion`; muestra la cuenta 3/2/1 con el anillo durante la preparación y mantiene el temporizador de 10 segundos durante la captura.
- `src/components/capture/CaptureControls.tsx`: añade textos para `"Preparando..."` y deshabilita el botón durante preparación y captura.
- `src/pages/TrainingPage.tsx` y `src/pages/PredictionPage.tsx`: consumen `preparacion`, usan las constantes exportadas y bloquean el selector de actividad durante preparación y captura.
- `src/index.css`: el mensaje de preparación reutiliza el color primario del tema claro, sin cambios de paleta ni modo oscuro.
- No se modificaron `src/services/database.ts`, `src/components/DatabaseTest.tsx`, las rutas, `App.tsx` ni archivos nativos Android. No se añadieron dependencias. `src/components/CaptureTest.tsx` sigue conservado y sin montarse en las rutas.

### Validación confirmada por el usuario

El usuario confirmó que la tarea 3.5 funciona correctamente. Se registra que la preparación de 3 segundos se ejecuta antes de la captura real de 10 segundos, que durante la preparación no se toman mediciones y que la cancelación, limpieza y reutilización funcionan correctamente. El agente no ejecutó instalaciones, compilación, lint, pruebas ni Git.

Se conservan los comandos siguientes como referencia de regresión para cambios futuros, no como pendientes de esta tarea. Desde `ml-sensores/`:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

Para Android, después del build:

```bash
npx cap sync android
npx cap open android
```

- [x] Funcionamiento validado por el usuario en Entrenamiento y Predicción.
- [x] Preparación de 3 segundos antes de la captura real de 10 segundos.
- [x] Sin mediciones durante la preparación.
- [x] Captura real de 10 segundos iniciada automáticamente al terminar la preparación.
- [x] Cancelación, limpieza y reutilización correctas, sin sesiones superpuestas.
- [x] Selector de actividad bloqueado durante preparación y captura.
- [x] Resultado con seis ejes, `tiempo_ms`, métricas y mediciones en memoria; duración registrada de aproximadamente 10 segundos.
- [x] Prueba de SQLite conservada.

**3.5 queda completada y validada por el usuario.** La Fase 3 fue finalizada posteriormente en la tarea 3.9.

## Tarea 3.6 — Guardado de capturas de Entrenamiento en SQLite: completada y validada por el usuario

### Cambios realizados

- `src/types/sensores.ts`: se añadió `MedicionCompleta` y `ResultadoCaptura` expone `duracion_ms`, `frecuencia_hz` y `medicionesCompletas`, además de las métricas formateadas para presentación.
- `src/types/records.ts`: `Medicion` reutiliza la variante completa y se añadió `EstadoGuardadoCaptura`.
- `src/hooks/useSensorCapture.ts`: calcula las métricas numéricas sin redondear y separa las mediciones completas de las que contienen lecturas nulas o no finitas.
- `src/pages/TrainingPage.tsx`: guarda automáticamente al finalizar una captura de Entrenamiento con UUID, fecha y actividad fijados una sola vez. Rechaza capturas incompletas o sin métricas válidas, detecta duplicados mediante `getRecordById` y permite reintentar con el mismo UUID.
- `src/components/capture/CaptureSaveStatus.tsx`: nuevo estado visible de guardado, con mensajes de éxito, rechazo por datos incompletos y error con reintento.
- `src/components/capture/CaptureControls.tsx`, `src/components/capture/CaptureResult.tsx` y `src/index.css`: ajustes de textos, bloqueo durante el guardado y estilos del estado.
- No se modificaron el esquema SQLite, `src/services/database.ts`, el módulo Predicción, las dependencias ni archivos nativos de Android.

### Validación confirmada por el usuario

El usuario validó la tarea 3.6 en un dispositivo Android real: preparación de 3 segundos y captura de 10 segundos correctas, guardado automático en SQLite correcto, UUID por registro correcto, persistencia tras reiniciar correcta y recuperación de un registro con aproximadamente 600 mediciones correcta. El módulo Predicción no presentó regresiones. TypeScript y build fueron correctos; el error de lint `no-useless-assignment` fue corregido antes de la validación final. El agente no ejecutó comandos, pruebas ni Git.

**3.6 queda completada y validada por el usuario.** La Fase 3 fue finalizada posteriormente en la tarea 3.9.

## Tarea 3.7 — Guardado de capturas de Predicción en SQLite: completada y validada por el usuario

### Cambios realizados

- `src/hooks/useCaptureSave.ts`: nuevo hook compartido que centraliza la validación de capturas, la creación de `CapturaPendiente`, el UUID, la fecha, el tipo, la actividad, el guardado, la detección de duplicados, los estados y el reintento.
- `src/pages/TrainingPage.tsx`: refactorizado para consumir `useCaptureSave` con `tipo: "entrenamiento"` y conservar el comportamiento validado de 3.6.
- `src/pages/PredictionPage.tsx`: guarda automáticamente al finalizar una captura con `tipo: "prediccion"` y `actividad: null`; muestra el estado de guardado y permite reintentar con el mismo UUID.
- No se modificaron el esquema SQLite, `src/services/database.ts`, los tipos compartidos, los componentes de captura, las dependencias ni archivos nativos de Android.

### Validación confirmada por el usuario

El usuario validó la tarea 3.7 en un dispositivo Android real: preparación de 3 segundos y captura de 10 segundos correctas, guardado automático en SQLite correcto, UUID único por registro, tipo `prediccion`, actividad `null`, estado `pendiente`, persistencia y recuperación de aproximadamente 600 mediciones correctas. La prueba de regresión de Entrenamiento fue superada después de integrar el hook compartido. `npm run typecheck`, `npm run lint` y `npm run build` fueron correctos. El agente no ejecutó comandos, pruebas ni Git.

**3.7 queda completada y validada por el usuario.** La Fase 3 fue finalizada posteriormente en la tarea 3.9.

## Tarea 3.8 — Listado y gestión de registros locales para sincronización: completada y validada por el usuario

### Cambios realizados

- `src/types/records.ts`: nuevo `RegistroResumen`, derivado de `Registro` sin `mediciones` y con `totalMediciones`.
- `src/services/database.ts`: nueva consulta `getRecordSummaries(tipo)` con `json_array_length(mediciones)`, filtro por tipo y orden por fecha descendente e ID ascendente. La validación comparte los campos comunes con `Registro`.
- `src/hooks/useRecordSummaries.ts`: consulta automática al entrar a la vista, estados de carga/error, reintento, protección contra respuestas obsoletas y contra actualizaciones después del desmontaje.
- `src/components/records/RecordsSyncView.tsx`: vista compartida para Entrenamiento y Predicción con título, descripción, contador, consulta automática, carga, vacío, error y reintento. Se eliminó el botón «Actualizar listado».
- `src/components/records/RecordList.tsx`: lista semántica de resúmenes.
- `src/components/records/RecordCard.tsx`: tarjeta con UUID, fecha, duración, frecuencia, cantidad de mediciones, actividad y estado; Predicción muestra “Sin etiqueta”.
- `src/pages/TrainingPage.tsx` y `src/pages/PredictionPage.tsx`: las vistas provisionales de Sincronizar se sustituyen por `RecordsSyncView` con el tipo correspondiente.
- `src/index.css`: estilos del listado, tarjetas, estados y adaptación responsive usando los tokens existentes. Se eliminaron los estilos del botón de actualización manual.
- No se modificaron rutas, esquema SQLite, dependencias, captura ni archivos nativos de Android. `DatabaseTest` se mantuvo en esa etapa y fue eliminado en 3.9-A. No se implementó sincronización remota ni se usa `markAsSynced`.

### Verificación estática

- `npm run typecheck`: correcto.
- `npm run lint`: correcto.
- `npm run build`: correcto.

### Validación Android confirmada por el usuario

- Compatibilidad de SQLite con `json_array_length()`.
- Listados separados de Entrenamiento y Predicción.
- Información correcta en las tarjetas.
- Cantidad de mediciones correcta.
- Consulta automática al entrar a Sincronizar.
- Persistencia de registros después de reiniciar.
- Navegación correcta entre módulos.
- Sin alteraciones de `estado_sync` ni sincronización remota.
- Captura y guardado de ambos módulos sin regresiones.
- Eliminación del botón «Actualizar listado», conservando «Reintentar» para errores.
- Verificaciones `typecheck`, `lint` y `build` aprobadas.

**3.8 queda completada y validada por el usuario.** La Fase 3 fue finalizada posteriormente en la tarea 3.9.

## Tarea 3.9-A — Limpieza completa y controlada: completada

### Cambios realizados

- `src/pages/TrainingPage.tsx`: retirados el import y el bloque desplegable de prueba de SQLite.
- `src/components/DatabaseTest.tsx`: eliminado.
- `src/components/CaptureTest.tsx`: eliminado.
- `src/App.css`: eliminado tras confirmar que no tenía imports ni consumidores activos.
- `src/index.css`: eliminados los estilos `.capture-test*` y `.capture-debug*`; se conservaron `.capture-result__details` y los estilos de la interfaz actual.
- No se modificaron el esquema SQLite, `src/services/database.ts`, `src/hooks/useSensorCapture.ts`, `src/hooks/useCaptureSave.ts`, los componentes de captura, guardado o listados, las rutas, la navegación ni los archivos nativos de Android.
- No se eliminaron registros ni se alteró la persistencia local.

### Verificación

- Se comprobó que no quedaran referencias a `DatabaseTest` ni `CaptureTest` dentro de `src/`.
- No se ejecutaron pruebas, lint, build ni Git durante la limpieza.

## Tarea 3.9-B — Validación integral en Android: completada y validada por el usuario

### Validaciones confirmadas

- Entrenamiento y Predicción funcionan de extremo a extremo.
- La preparación de 3 segundos y la captura de 10 segundos funcionan en ambos módulos.
- El guardado automático en SQLite funciona y los registros conservan UUID, fecha, tipo, actividad y estado pendiente.
- Los listados de Sincronizar muestran los resúmenes correctos por tipo y la cantidad de mediciones.
- La persistencia se conserva tras cerrar y reabrir la aplicación.
- La navegación entre módulos y la redirección de rutas desconocidas funcionan.
- La aplicación funciona sin conexión a internet.
- No se modificó el esquema SQLite, no se implementó sincronización remota y no se perdieron los registros existentes.
- Captura y guardado de ambos módulos no presentaron regresiones.

**3.9-B queda completada y validada por el usuario.**

## Cierre de Fase 3

La Fase 3 — Interfaz y captura queda finalizada. Las tareas 3.1 a 3.9 están completadas y validadas; la limpieza 3.9-A retiró las pruebas temporales y la validación 3.9-B confirmó el flujo completo en Android. No se modificó el esquema SQLite ni se implementó sincronización remota.

## Referencia histórica al cierre de Fase 3 — Fase 4: Integración con FastAPI y MongoDB

En la preparación de Fase 4, tras completar 5-B y 5-C, la sincronización HTTP seguía pendiente. Se había retirado el diagnóstico temporal de conectividad y conservado la infraestructura HTTP para implementar sincronización manual y reintentos. `markAsSynced` estaba reservado para confirmar la sincronización remota. Las capturas antiguas de entrenamiento sin participante se conservaron sin implementar su asociación posterior. Esta referencia histórica queda superada por el cierre de 5-D.3 documentado al inicio.

## Siguiente etapa — Fase 5: Machine Learning

Pendientes: dataset definitivo, preparación y análisis en Python/Jupyter, extracción de características, entrenamiento y evaluación del modelo. El flujo de inferencia mediante registros de Predicción y la demostración final permanecen pendientes en Fase 6. No se inicia ninguna de estas tareas durante esta actualización documental.
