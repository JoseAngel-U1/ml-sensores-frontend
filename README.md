# ML Sensores

Aplicación móvil para la recolección de datos de movimiento mediante los sensores de un dispositivo Android, con el propósito de construir un conjunto de datos y entrenar modelos de Machine Learning capaces de clasificar actividades físicas.

## Objetivo

Desarrollar un sistema que permita registrar datos del acelerómetro y giroscopio de un teléfono móvil para identificar tres actividades:

- Quieto
- Caminando
- Corriendo

La aplicación captura sesiones, las guarda localmente en SQLite y permite enviarlas manualmente a FastAPI/MongoDB. La recolección del dataset definitivo, el entrenamiento de modelos y la inferencia siguen pendientes.

## Tecnologías

**Aplicación móvil**
- React
- TypeScript (migración validada en Xiaomi 11T)
- Vite
- Capacitor
- SQLite (implementado y validado en Android)

**Backend integrado (servicio externo a este repositorio)**
- Python
- FastAPI
- MongoDB Atlas
- Despliegue de FastAPI en Render y comunicación HTTPS mediante `CapacitorHttp`.

**Machine Learning (planificado)**
- Python
- Pandas y NumPy
- Scikit-learn
- Jupyter Notebook

## Estado del proyecto

Las fases de captura, persistencia, participantes e integración están completadas. Las fases 5-C, 5-D.1, 5-D.2, 5-D.2-B y 5-D.3 fueron validadas por el usuario en Xiaomi 11T: conexión HTTPS, sincronización individual y masiva de Entrenamiento y Predicción y almacenamiento central en MongoDB. El usuario confirmó `typecheck`, `lint` y `build` satisfactorios.

La aplicación mantiene dos páginas —Entrenamiento y Predicción— con vistas internas Captura y Sincronizar. La numeración 5-B/5-C/5-D corresponde a subtareas de la Fase 4 histórica del frontend; no sustituye la Fase 5 de Machine Learning, todavía pendiente. Los detalles y el historial se conservan en [ROADMAP.md](ROADMAP.md) y [WORK_STATUS.md](WORK_STATUS.md).

Resultados de una captura de prueba de 10 segundos:

| Métrica | Resultado |
|---|---|
| Duración | 10 segundos |
| Mediciones recibidas | 601 |
| Mediciones válidas | 601 |
| Mediciones incompletas | 0 |
| Frecuencia promedio | 60.09 Hz |

Estos resultados corresponden a una prueba realizada en un Xiaomi 11T.

## Funcionalidades

- Recolección de sesiones etiquetadas para entrenamiento (implementada).
- Captura de nuevas sesiones sin etiqueta para predicción (implementada).
- Guardado de capturas reales mediante SQLite (implementado y validado en Android).
- Preparación de 3 segundos y captura de 10 segundos, con aceleración, velocidad de rotación y frecuencia medida.
- Gestión de participantes P-001 a P-999 para nuevas capturas de Entrenamiento.
- Vistas Sincronizar que muestran solo pendientes del módulo, con contador y acciones individuales.
- Sincronización manual individual y masiva en ambos módulos, con lotes secuenciales de hasta cinco registros por pulsación.
- Persistencia remota en MongoDB mediante FastAPI en Render, validada por el usuario.
- UUID local conservado para correlación e idempotencia. SQLite cambia a sincronizado únicamente tras confirmación válida.
- Eliminación local de pendientes con confirmación; no elimina documentos de MongoDB.
- Bloqueo compartido de sincronización y eliminación, manejo de errores, omitidos y respuestas parciales.
- Entrenamiento y comparación de modelos de clasificación (Fase 5, pendiente).
- Inferencia sobre nuevas sesiones mediante su identificador y demostración final (Fase 6, pendiente). El módulo Predicción actualmente captura y sincroniza datos sin etiqueta; no ejecuta un modelo.

## Arquitectura general

```text
Captura → useSensorCapture → useCaptureSave → SQLite
Vista Sincronizar → useRecordSync → sync.ts → CapacitorHttp → FastAPI (Render) → MongoDB
                                        └→ confirmación por UUID → SQLite
```

- `TrainingPage` y `PredictionPage` comparten componentes de captura y registros.
- `database.ts` gestiona registros, participantes, migración SQLite v2 y operaciones locales.
- `sync.ts` valida, transforma y envía; `recordOperations.ts` excluye sincronizaciones/eliminaciones simultáneas entre módulos.
- `AppLayout` reserva un área central desplazable y una barra de acción fija mediante portal encima de la navegación inferior.
- `POST /entrenamiento` y `POST /prediccion` reciben `{ "registros": [...] }`, tanto para un registro como para un lote. El transporte utiliza la misma infraestructura para ambos módulos.

## Ejecución del proyecto

### Requisitos

- Node.js compatible con las dependencias declaradas en `package.json` (Vite 8) y npm. El proyecto no fija una versión de Node mediante `engines`.
- Android Studio, SDK Android y JDK 21 para compilar la aplicación nativa. La configuración actual usa SDK mínimo 24 y compilación/objetivo 36.
- Dispositivo Android compatible con sensores de movimiento.

### Instalación

```bash
npm install
```

### Desarrollo web

```bash
npm run dev
```

### Compilación

La compilación incluye la verificación estricta de tipos. También puede ejecutarse por separado:

```bash
npm run typecheck
npm run lint
```

```bash
npm run build
```

`npm run preview` sirve localmente el build web ya generado. `package.json` no define un script de pruebas automatizadas. Ejecutar los comandos manualmente y continuar solo si el anterior termina correctamente.

### Sincronización con Android

```bash
npx cap sync android
npx cap open android
```

Desde Android Studio, ejecutar la aplicación en un dispositivo Android.

Capacitor utiliza `dist` como `webDir`: compilar antes de `npx cap sync android`. Esta sincronización copia el build y registra plugins; no envía capturas a FastAPI.

El navegador permite revisar interfaz y navegación. SQLite está habilitado únicamente en Android, sin sustituto en memoria o localStorage; los flujos de persistencia y envío de capturas deben probarse en el dispositivo. La captura de sensores también requiere un dispositivo compatible.

### Variables de entorno

La configuración pública disponible en `.env.example` es:

```dotenv
VITE_API_BASE_URL=https://ml-sensores-api.onrender.com
```

`src/config/api.ts` usa esa URL por defecto si la variable no existe. Para cambiarla, crear manualmente un `.env` a partir de `.env.example`, ajustar la URL y recompilar/sincronizar Android. Se exige HTTPS sin credenciales, query ni fragmento. Las variables `VITE_*` quedan incorporadas al cliente y no deben contener secretos. La aplicación no configura una conexión directa a MongoDB.

## Limitaciones y pendientes

- Un registro SQLite corrupto puede interrumpir la consulta del módulo durante la deserialización o validación. Los históricos legibles sin participante se omiten sin alterarlos.
- El envío es manual y no se reintenta automáticamente en segundo plano. Una respuesta parcial válida permite continuar; errores de red o respuestas inválidas detienen los siguientes lotes y conservan pendientes los no confirmados.
- El transporte establece un límite de espera de 60 segundos y timeouts nativos de conexión/lectura. Una petición nativa puede continuar tras ese límite; el bloqueo se mantiene hasta su finalización. Render puede demorar al iniciar el servicio.
- Pendientes: dataset definitivo, preparación y análisis en Python/Jupyter, extracción de características, entrenamiento/evaluación del modelo y flujo de inferencia.

## Organización del proyecto

El diseño implementado de SQLite, la API de almacenamiento y la validación de persistencia están documentados en [docs/SQLITE_DESIGN.md](docs/SQLITE_DESIGN.md). Los registros se generan mediante capturas reales; la sección temporal de prueba con datos sintéticos fue retirada en 3.9-A.

La arquitectura de páginas, componentes, participantes, sincronización y contrato HTTP consumido por el frontend está en [docs/UI_ARCHITECTURE.md](docs/UI_ARCHITECTURE.md). El procedimiento histórico de participantes se conserva en [docs/PARTICIPANTS_VALIDATION.md](docs/PARTICIPANTS_VALIDATION.md). El sistema visual aprobado está en [docs/design/DESIGN.md](docs/design/DESIGN.md); sus maquetas son referencias, no capturas de la aplicación actual.

Las reglas de colaboración están en [AGENTS.md](AGENTS.md). El proyecto continúa en desarrollo: captura, persistencia y sincronización están validadas; las siguientes etapas corresponden al dataset y Machine Learning.

## Propósito académico

Proyecto desarrollado con fines educativos para aplicar conceptos de adquisición de datos, desarrollo móvil y aprendizaje automático supervisado.
