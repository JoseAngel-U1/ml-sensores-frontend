# ML Sensores

Aplicación móvil para la recolección de datos de movimiento mediante los sensores de un dispositivo Android, con el propósito de construir un conjunto de datos y entrenar modelos de Machine Learning capaces de clasificar actividades físicas.

## Objetivo

Desarrollar un sistema que permita registrar datos del acelerómetro y giroscopio de un teléfono móvil para identificar tres actividades:

- Quieto
- Caminando
- Corriendo

El proyecto contempla la recolección de datos etiquetados, el almacenamiento local, la sincronización con una base de datos y la evaluación de modelos de clasificación supervisada.

## Tecnologías

**Aplicación móvil**
- React
- TypeScript (migración validada en Xiaomi 11T)
- Vite
- Capacitor
- SQLite (implementado y validado en Android)

**Backend (planificado)**
- Python
- FastAPI
- MongoDB Atlas

**Machine Learning (planificado)**
- Python
- Pandas y NumPy
- Scikit-learn
- Jupyter Notebook

## Estado del proyecto

Actualmente se completó la prueba de concepto para acceder a los sensores de movimiento desde una aplicación Android desarrollada con React y Capacitor.

La Fase 2 (TypeScript y almacenamiento SQLite) está completada. La Fase 3 (interfaz, captura, guardado local y listados) está completada y validada en Android: dos páginas —Entrenamiento y Predicción— con sus vistas internas Captura y Sincronizar. La limpieza 3.9-A retiró las pruebas temporales y la validación integral 3.9-B confirmó ambos módulos. La Fase 4 — Integración con FastAPI y MongoDB queda como siguiente etapa pendiente.

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
- Listado local de registros por tipo (implementado y validado en Android).
- Sincronización manual con una API desarrollada en FastAPI (Fase 4, pendiente).
- Persistencia remota en MongoDB (Fase 4, pendiente).
- Entrenamiento y comparación de modelos de clasificación (Fase 5, pendiente).
- Predicción de nuevas sesiones mediante su identificador (Fase 5, pendiente).

## Ejecución del proyecto

### Requisitos

- Node.js y npm.
- Android Studio para ejecutar la aplicación en Android.
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
```

```bash
npm run build
```

### Sincronización con Android

```bash
npx cap sync android
npx cap open android
```

Desde Android Studio, ejecutar la aplicación en un dispositivo Android.

La captura de sensores debe probarse en un dispositivo compatible; su funcionamiento puede variar en navegadores de escritorio.

## Organización del proyecto

El diseño implementado de SQLite, la API de almacenamiento y la validación de persistencia están documentados en [docs/SQLITE_DESIGN.md](docs/SQLITE_DESIGN.md). Los registros se generan mediante capturas reales; la sección temporal de prueba con datos sintéticos fue retirada en 3.9-A.

La arquitectura implementada de páginas, rutas, componentes compartidos y tema claro de la Fase 3 está en [docs/UI_ARCHITECTURE.md](docs/UI_ARCHITECTURE.md). El avance y las tareas verificables se mantienen en `WORK_STATUS.md` y `ROADMAP.md`.

El proyecto se encuentra en desarrollo. La captura, el almacenamiento local y los listados están completos; la siguiente etapa es la integración con FastAPI y MongoDB.

## Propósito académico

Proyecto desarrollado con fines educativos para aplicar conceptos de adquisición de datos, desarrollo móvil y aprendizaje automático supervisado.
