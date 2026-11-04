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

**Estado: Pendiente**

- [x] Migrar React de JavaScript a TypeScript (tipos y compilación web verificados; validación en Android pendiente).
- [ ] Verificar compilación y funcionamiento en Android.
- [ ] Integrar SQLite.
- [ ] Definir tipos y modelos de registros.
- [ ] Implementar almacenamiento y consultas locales.

## Fase 3 — Interfaz y captura

**Estado: Pendiente**

- [ ] Crear navegación y tema visual.
- [ ] Implementar módulo de recolección etiquetada.
- [ ] Implementar módulo de nuevas entradas para predicción.
- [ ] Incorporar cuenta regresiva de 3 segundos.
- [ ] Validar capturas y guardar registros.
- [ ] Implementar vista de registros pendientes.

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
