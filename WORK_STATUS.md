# WORK_STATUS — ML Sensores

## Estado general

**Etapa actual:** Fase 2 — Base técnica.

**Tarea activa:** Validación en Android de la migración a React + TypeScript.

## Trabajo completado

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

## Verificación de la migración (2026-11-04)

- `npm run typecheck`: correcto para la aplicación y la configuración de Vite.
- `npm run lint`: correcto. Se excluyeron archivos generados de Android y se declaró `detener` antes de `iniciar` para resolver el diagnóstico de pureza de React Hooks, sin cambiar sus operaciones.
- `npm run build`: correcto; genera la aplicación web en `dist/`.
- Dependencias de desarrollo añadidas: `typescript`, `@types/node` y `typescript-eslint`. Los tipos de React y React DOM ya estaban instalados.
- Se conservan la duración objetivo de 10 segundos, el intervalo de comprobación de 100 ms, la validación de los seis valores finitos y el cálculo de frecuencia como total / duración real.
- La interfaz y los estilos se conservan. La carpeta nativa `android/` no se modificó.
- La instalación informó 12 vulnerabilidades moderadas; no se aplicaron actualizaciones ajenas a la migración.
- Pendiente: sincronizar, compilar y ejecutar en el Xiaomi 11T y repetir la captura. Los 601 registros y 60.09 Hz documentados corresponden a la prueba anterior a la migración.

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

### Validación de la migración en Android

**Objetivo:** Confirmar en el dispositivo físico la captura de sensores después de la migración implementada.

**Pasos pendientes (desde la raíz `ml-sensores/`):**
```bash
npm run build
npx cap sync android
npx cap open android
```

Ejecutar desde Android Studio en el Xiaomi 11T, pulsar «Iniciar captura» y comprobar el cierre automático tras aproximadamente 10 segundos, mediciones válidas, duración, frecuencia y primera/última medición visibles. Repetir la captura para verificar el reinicio de los contadores. Registrar los resultados reales; la frecuencia se mide y no tiene que coincidir exactamente con 60.09 Hz.

**Restricciones:**
- No recrear el proyecto.
- No eliminar ni reinicializar Android.
- No integrar SQLite todavía.
- No modificar la funcionalidad de captura.

**Criterios de aceptación:**
- [x] TypeScript sin errores.
- [x] Compilación web exitosa.
- [ ] Aplicación migrada ejecutable en Android.
- [ ] Captura de 10 segundos funcional en el dispositivo después de la migración.
- [ ] Resultados y métricas visibles en el dispositivo después de la migración.

## Bloqueos

Ninguno identificado.

## Siguiente etapa

Integración de SQLite y persistencia local de sesiones.
