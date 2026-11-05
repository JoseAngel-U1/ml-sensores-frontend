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

**Estado: En progreso — tarea 3.1 completada y validada por el usuario; siguiente tarea: 3.2**

Referencia: [docs/UI_ARCHITECTURE.md](docs/UI_ARCHITECTURE.md). Solo dos páginas principales (`TrainingPage` y `PredictionPage`), cada una con vistas internas Captura y Sincronizar. Rutas aprobadas: `/entrenamiento`, `/entrenamiento/sincronizar`, `/prediccion` y `/prediccion/sincronizar`. `App.tsx` definirá las rutas y redirigirá las desconocidas a `/entrenamiento`; `AppLayout` compartirá encabezado, navegación inferior y contenido activo.

- [x] Documentar arquitectura, reutilización de código existente y paleta exclusivamente clara.
- [x] **3.1 — Extraer el hook reutilizable de sensores.** Completada y validada por el usuario. La lógica está separada de `App.tsx` en `useSensorCapture`; la captura de 10 segundos sigue funcionando, con frecuencia medida, validación, mediciones completas en el resultado y limpieza de recursos.
- [ ] **3.2 — Implementar navegación con React Router.** Crear las dos páginas y `AppLayout` con encabezado y navegación inferior funcionales. Verificar las cuatro rutas, cambio de vistas, redirección de `/` y rutas desconocidas, historial y botón Atrás en Android.
- [ ] **3.3 — Aplicar el tema claro compartido.** Usar [docs/design/DESIGN.md](docs/design/DESIGN.md) como fuente oficial de estilos y [docs/design/references/](docs/design/references/) para las cuatro vistas; aplicar la prioridad de Functional Palette y las equivalencias claras ya corregidas en el YAML, según la sección 6 de `docs/UI_ARCHITECTURE.md`. Interpretar los tokens adicionales solo si se utilizan. Verificar ambas páginas, legibilidad y ausencia de modo oscuro/selector de temas.
- [ ] **3.4 — Compartir componentes de captura.** Reloj y controles para ambos módulos; selector `quieto`/`caminando`/`corriendo` solo en entrenamiento. Verificar que predicción no solicite actividad.
- [ ] **3.5 — Incorporar cuenta regresiva de 3 segundos.** Separarla de los 10 segundos de captura; definir navegación durante captura y verificar temporizadores, limpieza y ausencia de sesiones superpuestas.
- [ ] **3.6 — Integrar guardado de entrenamiento.** Resolver exposición de muestras completas/métricas numéricas y tratamiento de muestras incompletas; construir `Registro` con actividad obligatoria, UUID, fecha ISO y estado pendiente. Verificar guardado y recuperación mediante SQLite existente, incluyendo errores.
- [ ] **3.7 — Integrar guardado de predicción.** Reutilizar hook, controles y servicio; guardar `tipo: prediccion` y `actividad: null`. Verificar recuperación y persistencia sin conexión.
- [ ] **3.8 — Implementar vistas internas Sincronizar.** Reutilizar tarjetas/listados, consultar registros locales y filtrar por tipo; verificar estados pendiente/sincronizado, carga, vacío y error. El envío manual real queda en Fase 4; no simularlo ni marcar éxito remoto.
- [ ] **3.9 — Validar el flujo completo en Android.** Verificar ambos módulos, reinicio de capturas, persistencia tras cerrar/reabrir y navegación; retirar la prueba temporal de la interfaz principal cuando el flujo equivalente esté validado.

Las verificaciones de tipos, lint, build y Android de cada tarea serán ejecutadas manualmente por el usuario. Crear carpetas y componentes progresivamente, sin duplicar servicios/tipos existentes ni generar archivos vacíos.

## Fase 4 — Backend y sincronización

**Estado: Pendiente**

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
