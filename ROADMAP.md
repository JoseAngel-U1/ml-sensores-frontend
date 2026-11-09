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

**Estado: Completada — tareas 3.1 a 3.9 completadas y validadas. La preparación de Fase 4 incorpora participantes locales en Fase 5-B, completada y validada por el usuario; la sincronización HTTP sigue pendiente.**

Referencia: [docs/UI_ARCHITECTURE.md](docs/UI_ARCHITECTURE.md). Solo dos páginas principales (`TrainingPage` y `PredictionPage`), cada una con vistas internas Captura y Sincronizar. Rutas aprobadas: `/entrenamiento`, `/entrenamiento/sincronizar`, `/prediccion` y `/prediccion/sincronizar`. `App.tsx` define las rutas y redirige las desconocidas a `/entrenamiento`; `AppLayout` comparte encabezado, navegación inferior y contenido activo.

- [x] Documentar arquitectura, reutilización de código existente y paleta exclusivamente clara.
- [x] **3.1 — Extraer el hook reutilizable de sensores.** Completada y validada por el usuario. La lógica está separada de `App.tsx` en `useSensorCapture`; la captura de 10 segundos sigue funcionando, con frecuencia medida, validación, mediciones completas en el resultado y limpieza de recursos.
- [x] **3.2 — Implementar navegación con React Router.** Completada y validada por el usuario en navegador y Android: dos páginas, cuatro rutas, estructura compartida y navegación funcional, conservando las pruebas de sensores y SQLite.
- [x] **3.3 — Aplicar el tema claro compartido.** Completada y validada por el usuario, quien confirmó haber realizado el commit de la implementación. Base visual con tokens de Functional Palette, tipografía con alternativas locales, espaciados, superficies, botones y estructura compartida según [docs/design/DESIGN.md](docs/design/DESIGN.md) y [docs/design/references/](docs/design/references/). Las fuentes oficiales no están empaquetadas; la diferencia se conserva documentada en WORK_STATUS.md.
- [x] **3.4 — Compartir componentes de captura.** Completada y validada por el usuario en navegador y Android. Reloj y controles compartidos entre ambos módulos, con selector de actividad solo en entrenamiento y captura funcional en Predicción sin guardado. El usuario aprobó el reloj circular que inicia lleno y se vacía durante los 10 segundos, el selector mediante botones en lugar de desplegable y la conservación de las pruebas de SQLite.
- [x] **3.5 — Incorporar cuenta regresiva de 3 segundos.** Completada y validada por el usuario. La preparación de 3 segundos funciona antes de la captura real de 10 segundos; durante la preparación no se toman mediciones. La cancelación, limpieza y reutilización funcionan correctamente, sin sesiones superpuestas.
- [x] **3.6 — Guardado de capturas de Entrenamiento en SQLite.** Completada y validada por el usuario en Android. Se expusieron métricas numéricas y muestras completas, se rechazan las capturas incompletas y se guarda automáticamente un `Registro` con actividad obligatoria, UUID, fecha ISO y estado pendiente. Verificados el guardado, el UUID por registro, la recuperación de aproximadamente 600 mediciones y la persistencia tras reiniciar; Predicción no presentó regresiones.
- [x] **3.7 — Integrar guardado de predicción.** Completada y validada por el usuario en Android. Se extrajo la lógica compartida a `useCaptureSave`, se reutilizó en Entrenamiento y Predicción, y se guarda automáticamente con `tipo: prediccion`, `actividad: null` y estado pendiente. Verificados UUID por registro, persistencia y recuperación de aproximadamente 600 mediciones; la regresión de Entrenamiento fue superada.
- [x] **3.8 — Listado y gestión de registros locales para sincronización.** Completada y validada por el usuario en Android. Las vistas internas Sincronizar consultan resúmenes por tipo con `getRecordSummaries`, muestran tarjetas con UUID, fecha, duración, frecuencia, cantidad de mediciones, actividad y estado, y cubren carga, vacío, error y reintento. Se confirmó la compatibilidad de SQLite con `json_array_length()`, el filtrado por tipo, la consulta automática al entrar, la persistencia, la navegación y la ausencia de cambios en `estado_sync` o sincronización remota. Se eliminó el botón «Actualizar listado» conservando «Reintentar» para errores. `typecheck`, `lint` y `build` fueron aprobados; captura y guardado de ambos módulos no presentaron regresiones. El envío manual real queda en Fase 4.
- [x] **3.9 — Validación integral en Android.** Completada y validada por el usuario. La limpieza 3.9-A retiró `DatabaseTest`, `CaptureTest`, sus estilos exclusivos y `App.css`. La validación 3.9-B confirmó Entrenamiento y Predicción de extremo a extremo: captura, guardado SQLite, listados, persistencia, navegación y funcionamiento sin internet. Se conservaron los registros existentes, no se modificó el esquema SQLite y no se implementó sincronización remota.

Las verificaciones de tipos, lint, build y Android de cada tarea fueron ejecutadas manualmente por el usuario. Las carpetas y componentes se crearon progresivamente, sin duplicar servicios/tipos existentes ni generar archivos vacíos.

## Fase 4 — Integración con FastAPI y MongoDB

**Estado: En preparación — Fase 5-B completada y validada por el usuario; siguiente etapa: Fase 5-C, conectividad HTTPS con FastAPI en Render. Sincronización HTTP pendiente.**

La Fase 3 quedó finalizada; la sincronización remota y la integración con el backend se abordarán en esta fase.

### Fase 5-B — Participantes locales (numeración coordinada con el backend)

Implementación en código: tabla `participantes`, secuencia persistente, migración SQLite v2, selector con confirmaciones y asociación fija a nuevas capturas de entrenamiento. Se conservan las capturas antiguas sin participante. No se implementó HTTP.

- [x] Typecheck, lint y build correctos, confirmados por el usuario.
- [x] Aplicación compilada y ejecutada en Xiaomi 11T; gestión de participantes validada por el usuario.
- [x] Rediseño del selector probado y aprobado: una fila horizontal con desplegable y botones de iconos + y papelera.
- [x] Conservar confirmaciones de creación y eliminación mediante `window.confirm`; no implementar toast por ahora.

**Estado de Fase 5-B: Completada y validada por el usuario.** El procedimiento detallado de `docs/PARTICIPANTS_VALIDATION.md` se conserva como referencia de regresión; la confirmación global no se registra como ejecución individual de sus doce casos.

### Siguiente etapa — Fase 5-C

**Conectividad HTTPS entre Android y FastAPI desplegada en Render: pendiente.** La numeración 5-B/5-C corresponde a las tareas coordinadas con el backend, dentro de la Fase 4 histórica del frontend. No reemplaza la Fase 5 de Machine Learning que figura más adelante. La sincronización HTTP continúa pendiente.

### Plan histórico de integración

- [ ] Crear API con FastAPI.
- [ ] Configurar MongoDB.
- [ ] Implementar endpoints de entrenamiento y predicción.
- [ ] Implementar sincronización manual.
- [ ] Evitar duplicados mediante identificadores estables.
- [ ] Comprobar funcionamiento sin conexión.

## Fase 5 — Machine Learning

**Estado: Pendiente**

- [ ] Recolectar 90 sesiones etiquetadas: 30 por actividad.
- [ ] Consultar y preparar los datos.
- [ ] Extraer características estadísticas.
- [ ] Entrenar KNN, Random Forest y Regresión Logística.
- [ ] Evaluar y comparar modelos.
- [ ] Guardar el modelo seleccionado.

## Fase 6 — Predicción y demostración

**Estado: Pendiente**

- [ ] Capturar una sesión sin etiqueta.
- [ ] Sincronizarla con MongoDB.
- [ ] Consultar registros pendientes desde Jupyter.
- [ ] Seleccionar un registro por ID.
- [ ] Generar y guardar su predicción.
- [ ] Realizar pruebas finales del flujo completo.

## Criterio de finalización

El proyecto se considerará funcional cuando sea posible capturar datos en Android, almacenarlos sin conexión, sincronizarlos, entrenar modelos y clasificar una nueva sesión mediante su identificador.
