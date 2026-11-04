# WORK_STATUS — ML Sensores

## Estado general

**Etapa actual:** Fase 2 — Base técnica.

**Tarea activa:** Migración de React + JavaScript a React + TypeScript.

## Trabajo completado

- Proyecto inicial creado con React y Vite.
- Capacitor configurado para Android.
- Aplicación ejecutada en Xiaomi 11T.
- Acceso funcional a acelerómetro y velocidad de rotación mediante `devicemotion`.
- Prueba de captura de 10 segundos completada.
- 601 mediciones recibidas y válidas.
- Frecuencia promedio observada: 60.09 Hz.
- Repositorio GitHub inicial publicado.

## Decisiones aprobadas

- React + TypeScript.
- Capacitor para Android.
- SQLite como almacenamiento local.
- FastAPI como backend.
- MongoDB Atlas como base de datos remota.
- Sincronización manual de registros.
- Clasificación de quieto, caminando y corriendo.
- Procesamiento y predicción desde Python/Jupyter.

## Próxima tarea

### Migración a TypeScript

**Objetivo:** Migrar el proyecto existente sin perder la captura de sensores.

**Alcance:**
- Instalar y configurar TypeScript.
- Migrar componentes y archivos necesarios.
- Tipar los datos y eventos de sensores.
- Actualizar scripts de compilación y verificación.
- Comprobar funcionamiento en Android.

**Restricciones:**
- No recrear el proyecto.
- No eliminar ni reinicializar Android.
- No integrar SQLite todavía.
- No modificar la funcionalidad de captura.

**Criterios de aceptación:**
- TypeScript sin errores.
- Compilación exitosa.
- Aplicación ejecutable en Android.
- Captura de 10 segundos funcional.
- Resultados y métricas visibles.

## Bloqueos

Ninguno identificado.

## Siguiente etapa

Integración de SQLite y persistencia local de sesiones.