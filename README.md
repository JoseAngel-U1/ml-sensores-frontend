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
- SQLite (integración inicial implementada; validación de persistencia pendiente)

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

Resultados de una captura de prueba de 10 segundos:

| Métrica | Resultado |
|---|---|
| Duración | 10 segundos |
| Mediciones recibidas | 601 |
| Mediciones válidas | 601 |
| Mediciones incompletas | 0 |
| Frecuencia promedio | 60.09 Hz |

Estos resultados corresponden a una prueba realizada en un Xiaomi 11T.

## Funcionalidades planificadas

- Recolección de sesiones etiquetadas para entrenamiento.
- Captura de nuevas sesiones sin etiqueta para predicción.
- Almacenamiento local mediante SQLite.
- Sincronización manual con una API desarrollada en FastAPI.
- Persistencia remota en MongoDB.
- Entrenamiento y comparación de modelos de clasificación.
- Predicción de nuevas sesiones mediante su identificador.

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

El diseño aprobado de SQLite, la API de almacenamiento y el procedimiento de prueba manual están documentados en [docs/SQLITE_DESIGN.md](docs/SQLITE_DESIGN.md). La interfaz incluye una sección temporal de prueba con datos sintéticos, independiente de la captura de sensores.

El proyecto se encuentra en desarrollo. Su estructura se ampliará conforme se implementen los módulos de captura, persistencia local y sincronización.

## Propósito académico

Proyecto desarrollado con fines educativos para aplicar conceptos de adquisición de datos, desarrollo móvil y aprendizaje automático supervisado.
