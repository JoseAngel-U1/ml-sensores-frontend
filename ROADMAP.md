# ROADMAP — ML Sensores

## Objetivo

Desarrollar una aplicación Android capaz de recolectar sesiones de movimiento, almacenarlas localmente, sincronizarlas con MongoDB mediante FastAPI y utilizarlas para entrenar y evaluar modelos de clasificación de actividades.

## Fase 1 — Prueba de concepto

**Estado: Completada**

- [x] Crear proyecto React + Vite.
- [x] Integrar Capacitor para Android.
- [x] Ejecutar aplicación en dispositivo físico.
- [x] Acceder a eventos de movimiento.
- [x] Implementar captura de 10 segundos.
- [x] Validar disponibilidad de seis valores.
- [x] Calcular frecuencia promedio.

Resultado de referencia: 601 mediciones válidas en 10 segundos, con frecuencia promedio de 60.09 Hz.

## Fase 2 — Base técnica

**Estado: Completada**

- [x] Migrar React de JavaScript a TypeScript.
- [x] Verificar compilación y funcionamiento en Android de la migración (confirmado por el usuario en Xiaomi 11T).
- [x] Integrar SQLite (validado según confirmación del usuario).
- [x] Definir tipos y modelos de registros (según `docs/SQLITE_DESIGN.md`; validación confirmada por el usuario).
- [x] Implementar almacenamiento y consultas locales (persistencia en Android validada según confirmación del usuario).

## Fase 3 — Interfaz y captura

**Estado: Completada — tareas 3.1 a 3.9 completadas y validadas. La integración HTTP se completó posteriormente en la Fase 4.**

Referencia: [docs/UI_ARCHITECTURE.md](docs/UI_ARCHITECTURE.md). Solo dos páginas principales (`TrainingPage` y `PredictionPage`), cada una con vistas internas Captura y Sincronizar. Rutas aprobadas: `/entrenamiento`, `/entrenamiento/sincronizar`, `/prediccion` y `/prediccion/sincronizar`. `App.tsx` define las rutas y redirige las desconocidas a `/entrenamiento`; `AppLayout` comparte encabezado, navegación inferior y contenido activo.

- [x] Documentar arquitectura, reutilización de código existente y paleta exclusivamente clara.
- [x] **3.1 — Extraer el hook reutilizable de sensores.** Completada y validada por el usuario. La lógica está separada de `App.tsx` en `useSensorCapture`; la captura de 10 segundos sigue funcionando, con frecuencia medida, validación, mediciones completas en el resultado y limpieza de recursos.
- [x] **3.2 — Implementar navegación con React Router.** Completada y validada por el usuario en navegador y Android: dos páginas, cuatro rutas, estructura compartida y navegación funcional, conservando las pruebas de sensores y SQLite.
- [x] **3.3 — Aplicar el tema claro compartido.** Completada y validada por el usuario, quien confirmó haber realizado el commit de la implementación. Base visual con tokens de Functional Palette, tipografía con alternativas locales, espaciados, superficies, botones y estructura compartida según [docs/design/DESIGN.md](docs/design/DESIGN.md) y [docs/design/references/](docs/design/references/). Las fuentes oficiales no están empaquetadas; la diferencia se conserva documentada en WORK_STATUS.md.
- [x] **3.4 — Compartir componentes de captura.** Completada y validada por el usuario en navegador y Android. Reloj y controles compartidos entre ambos módulos, con selector de actividad solo en entrenamiento y captura funcional en Predicción sin guardado. El usuario aprobó el reloj circular que inicia lleno y se vacía durante los 10 segundos, el selector mediante botones en lugar de desplegable y la conservación de las pruebas de SQLite.
- [x] **3.5 — Incorporar cuenta regresiva de 3 segundos.** Completada y validada por el usuario. La preparación de 3 segundos funciona antes de la captura real de 10 segundos; durante la preparación no se toman mediciones. La cancelación, limpieza y reutilización funcionan correctamente, sin sesiones superpuestas.
- [x] **3.6 — Guardado de capturas de Entrenamiento en SQLite.** Completada y validada por el usuario en Android. Se expusieron métricas numéricas y muestras completas, se rechazan las capturas incompletas y se guarda automáticamente un `Registro` con actividad obligatoria, UUID, fecha ISO y estado pendiente. Verificados el guardado, el UUID por registro, la recuperación de aproximadamente 600 mediciones y la persistencia tras reiniciar; Predicción no presentó regresiones.
- [x] **3.7 — Integrar guardado de predicción.** Completada y validada por el usuario en Android. Se extrajo la lógica compartida a `useCaptureSave`, se reutilizó en Entrenamiento y Predicción, y se guarda automáticamente con `tipo: prediccion`, `actividad: null` y estado pendiente. Verificados UUID por registro, persistencia y recuperación de aproximadamente 600 mediciones; la regresión de Entrenamiento fue superada.
- [x] **3.8 — Listado y gestión de registros locales para sincronización.** Completada y validada por el usuario en Android. Las vistas internas Sincronizar consultan resúmenes por tipo con `getRecordSummaries`, muestran tarjetas con UUID, fecha, duración, frecuencia, cantidad de mediciones, actividad y estado, y cubren carga, vacío, error y reintento. Se confirmó la compatibilidad de SQLite con `json_array_length()`, el filtrado por tipo, la consulta automática al entrar, la persistencia, la navegación y la ausencia de cambios en `estado_sync` o sincronización remota. Se eliminó el botón «Actualizar listado» conservando «Reintentar» para errores. `typecheck`, `lint` y `build` fueron aprobados; captura y guardado de ambos módulos no presentaron regresiones. El envío manual real se completó posteriormente en la Fase 4 (5-D).
- [x] **3.9 — Validación integral en Android.** Completada y validada por el usuario. La limpieza 3.9-A retiró `DatabaseTest`, `CaptureTest`, sus estilos exclusivos y `App.css`. La validación 3.9-B confirmó Entrenamiento y Predicción de extremo a extremo: captura, guardado SQLite, listados, persistencia, navegación y funcionamiento sin internet. Se conservaron los registros existentes, no se modificó el esquema SQLite y no se implementó sincronización remota.

Las verificaciones de tipos, lint, build y Android de cada tarea fueron ejecutadas manualmente por el usuario. Las carpetas y componentes se crearon progresivamente, sin duplicar servicios/tipos existentes ni generar archivos vacíos.

## Fase 4 — Integración con FastAPI y MongoDB

**Estado: Completada y validada en Android — Fases 5-C, 5-D.1, 5-D.2, 5-D.2-B y 5-D.3 completadas según confirmación del usuario. Sincronización de ambos módulos probada en Xiaomi 11T y almacenamiento en MongoDB verificado.**

La integración utiliza FastAPI desplegada en Render, conexión HTTPS y MongoDB como almacenamiento central. Typecheck, lint y build ejecutados satisfactoriamente por el usuario. La siguiente etapa pendiente es la recolección del dataset definitivo y el trabajo de Machine Learning.

### Fase 5-B — Participantes locales (numeración coordinada con el backend)

Implementación en código: tabla `participantes`, secuencia persistente, migración SQLite v2, selector con confirmaciones y asociación fija a nuevas capturas de entrenamiento. Se conservan las capturas antiguas sin participante. No se implementó HTTP.

- [x] Typecheck, lint y build correctos, confirmados por el usuario.
- [x] Aplicación compilada y ejecutada en Xiaomi 11T; gestión de participantes validada por el usuario.
- [x] Rediseño del selector probado y aprobado: una fila horizontal con desplegable y botones de iconos + y papelera.
- [x] Conservar confirmaciones de creación y eliminación mediante `window.confirm`; no implementar toast por ahora.

**Estado de Fase 5-B: Completada y validada por el usuario.** El procedimiento detallado de `docs/PARTICIPANTS_VALIDATION.md` se conserva como referencia de regresión; la confirmación global no se registra como ejecución individual de sus doce casos.

### Fase 5-C — Prueba manual de conectividad HTTPS

**Completada y validada por el usuario en Xiaomi 11T.** La prueba HTTPS mediante `CapacitorHttp` contra `https://ml-sensores-api.onrender.com/openapi.json` devolvió HTTP 200, verificó las rutas esperadas y registró **32669 ms** de respuesta. Servidor: Render. No se enviaron capturas.

- [x] Validar HTTP 200 y rutas esperadas desde Xiaomi 11T, según confirmación del usuario.
- [x] Retirar botón temporal, estilos exclusivos y hook de diagnóstico sin consumidores.
- [x] Conservar configuración HTTPS, `.env.example` y servicio HTTP reutilizable con errores y timeouts.

No se atribuyen resultados individuales a typecheck/lint/build, pruebas sin conexión, timeout o comparación Wi-Fi/datos móviles que no hayan sido confirmados. La limpieza del diagnóstico se revisó estáticamente.

La numeración 5-B/5-C/5-D corresponde a las tareas coordinadas con el backend, dentro de la Fase 4 histórica del frontend. No reemplaza la Fase 5 de Machine Learning que figura más adelante.

### Fase 5-D.1 — Núcleo de sincronización

**Completada y validada en Android (Xiaomi 11T) por el usuario, con typecheck, lint y build satisfactorios.**

- [x] Tipos del contrato de sincronización en `src/types/sync.ts`.
- [x] Servicio `src/services/sync.ts` con elegibilidad local, transformación explícita, lotes de cinco, correlación por UUID, validación de contadores y bloqueo de sincronizaciones concurrentes.
- [x] Reenvío idempotente conservando los UUID; solo se confirman `guardado` y `existente` con `id_mongo` válido.
- [x] Sin conexión a la interfaz ni peticiones reales durante la implementación.

### Fase 5-D.2 — Sincronización manual de Predicción

**Completada y validada por el usuario en Xiaomi 11T.**

- [x] `getPendingRecords(tipo?)` filtra por tipo en SQL antes de deserializar las mediciones; sin argumento conserva ambos tipos.
- [x] `RecordsSyncView` muestra exclusivamente registros pendientes del módulo actual, reutilizando `RecordList` y `RecordCard`.
- [x] Barra de acción fija sobre la navegación inferior, con contenido desplazable y respeto del área segura.
- [x] Hook reutilizable `useRecordSync` con bloqueo de dobles pulsaciones, resumen y limpieza segura al desmontar.
- [x] Predicción envía `POST /prediccion` en lotes secuenciales de cinco mediante el servicio de 5-D.1.
- [x] En esta etapa, Entrenamiento conservó la estructura visual con la acción deshabilitada; se habilitó posteriormente en 5-D.3.
- [x] Validación de la fase en Xiaomi 11T confirmada por el usuario; no se atribuyen resultados individuales no detallados.


### Fase 5-D.2-B — Acciones individuales en pendientes

**Completada y validada en Android (Xiaomi 11T), según confirmación del usuario; guardada mediante commit.**

- Sincronización por UUID reutilizando el procesador de lotes y sus validaciones; masiva conserva lotes de cinco.
- Eliminación local confirmada mediante `window.confirm`, condicionada por UUID, tipo y estado pendiente en SQL.
- Bloqueo observable compartido entre envíos individuales, masivos y eliminación, incluso al navegar.
- Tarjetas con grid de estado, nube/subida y papelera; acciones opcionales exclusivas de Sincronizar.
- En esta etapa, Predicción permitió ambas acciones y Entrenamiento solo eliminación; su HTTP se habilitó en 5-D.3.
- Validación global de la fase confirmada por el usuario. Los escenarios de respuestas, red, cancelación, concurrencia, navegación y alineación se conservan como referencia de regresión.
- Sin POST reales durante la implementación del agente.

### Fase 5-D.3 — Sincronización de Entrenamiento

**Completada y validada en Android (Xiaomi 11T) por el usuario. Almacenamiento en MongoDB verificado.**

- [x] Habilitar Entrenamiento en `useRecordSync` y `RecordsSyncView`, para nube individual y botón masivo fijo.
- [x] Reutilizar `sincronizarRegistro`, `sincronizarPendientes`, transformaciones, validación y bloqueo compartido; `POST /entrenamiento`, lotes secuenciales de hasta cinco.
- [x] Mostrar UUID y motivo de entrenamientos omitidos, sin corregir datos históricos ni asignar participantes.
- [x] Conservar UUID, actividad, participante, fecha, métricas y todas las mediciones originales; payload explícito sin propiedades locales adicionales.
- [x] Typecheck, lint y build ejecutados satisfactoriamente por el usuario.
- [x] Sincronización de Entrenamiento y Predicción probada en Xiaomi 11T; almacenamiento central en MongoDB verificado y cierre de 5-D.3 confirmado por el usuario.

Escenarios de referencia para regresión: envío individual/masivo, payload, guardado/existente/fallido, red/timeout, inválidos, contador, eliminación, navegación y persistencia. La confirmación global no añade resultados individuales que no se hayan detallado.

Revisión del agente durante la implementación: estática, sin comandos ni POST reales; la validación posterior fue realizada por el usuario. Limitación conocida: un registro SQLite corrupto podría interrumpir la consulta del módulo durante la deserialización; los históricos legibles sin participante sí se omiten y permiten enviar los demás válidos.

### Plan histórico de integración

- [x] API FastAPI disponible y desplegada en Render.
- [x] MongoDB configurado; almacenamiento central verificado por el usuario.
- [x] Endpoints de entrenamiento y predicción integrados.
- [x] Sincronización manual individual y masiva en ambos módulos.
- [x] UUID local conservado para correlación e idempotencia.
- [x] Captura y persistencia local sin conexión validadas en 3.9; se conserva el manejo de errores de envío y los pendientes no confirmados.

## Fase 5 — Machine Learning

**Estado: Pendiente**

- [ ] Recolectar 90 sesiones etiquetadas: 30 por actividad.
- [ ] Consultar, preparar y analizar el dataset definitivo en Python/Jupyter.
- [ ] Extraer características estadísticas.
- [ ] Entrenar KNN, Random Forest y Regresión Logística.
- [ ] Evaluar y comparar modelos.
- [ ] Guardar el modelo seleccionado.

## Fase 6 — Predicción y demostración

**Estado: Pendiente**

- [x] Capturar una sesión sin etiqueta (infraestructura de Predicción ya implementada).
- [x] Sincronizarla con MongoDB (validado por el usuario).
- [ ] Consultar registros pendientes desde Jupyter.
- [ ] Seleccionar un registro por ID.
- [ ] Generar y guardar su predicción.
- [ ] Realizar pruebas finales del flujo completo.

## Criterio de finalización

El proyecto se considerará funcional cuando sea posible capturar datos en Android, almacenarlos sin conexión, sincronizarlos, entrenar modelos y clasificar una nueva sesión mediante su identificador.
