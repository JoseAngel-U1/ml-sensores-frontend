# AGENTS.md — ML Sensores

## 1. Contexto

ML Sensores es un proyecto académico para registrar datos de movimiento desde un dispositivo Android y utilizarlos en modelos de clasificación supervisada.

Las actividades que se desean clasificar son:

- Quieto
- Caminando
- Corriendo

El desarrollo debe priorizar simplicidad, funcionalidad y facilidad de mantenimiento.

## 2. Tecnologías aprobadas

**Aplicación móvil**
- React + TypeScript
- Vite
- Capacitor para Android
- SQLite para persistencia local

**Backend**
- Python + FastAPI
- MongoDB Atlas

**Machine Learning**
- Python
- Pandas y NumPy
- Scikit-learn
- Jupyter Notebook

No sustituir estas tecnologías sin aprobación.

## 3. Reglas de desarrollo

1. Inspeccionar el código existente antes de modificarlo.
2. Presentar un plan breve antes de realizar cambios importantes.
3. Trabajar únicamente en el alcance de la tarea solicitada.
4. Conservar las funcionalidades existentes.
5. Preferir soluciones simples y evitar dependencias innecesarias.
6. Utilizar TypeScript con tipos explícitos y evitar `any`.
7. Mantener separadas las responsabilidades de interfaz, sensores, almacenamiento y comunicación con la API.
8. No incluir credenciales ni información sensible en el repositorio.
9. No ejecutar comandos destructivos ni modificar configuraciones nativas de Android sin justificación.
10. No realizar commits ni push automáticamente.

## 4. Reglas funcionales

- Las capturas tendrán una duración objetivo de 10 segundos.
- Se registrarán datos de aceleración y velocidad de rotación con marcas de tiempo.
- Las capturas de entrenamiento incluirán una etiqueta de actividad.
- Las capturas para predicción no incluirán una etiqueta de actividad.
- Cada sesión tendrá un identificador único generado en el dispositivo.
- Los registros se guardarán localmente antes de intentar sincronizarlos.
- La sincronización con FastAPI será manual.
- Los registros no deberán perderse por falta de conexión.
- La frecuencia de captura será medida, no asumida como constante.

## 5. Verificación

Después de cada implementación:

1. Ejecutar las verificaciones de tipos disponibles.
2. Ejecutar la compilación del proyecto.
3. Informar los errores encontrados y las correcciones realizadas.
4. Indicar si es necesaria una prueba en Android físico.

Las pruebas de sensores deben validarse en un dispositivo real.

## 6. Documentación

Consultar `README.md`, `ROADMAP.md` y `WORK_STATUS.md` antes de comenzar tareas importantes.

Actualizar `WORK_STATUS.md` al completar una etapa o cambiar el estado de una tarea.

No marcar una funcionalidad como terminada sin haberla verificado.

Para tareas de interfaz y captura de la Fase 3, consultar `docs/UI_ARCHITECTURE.md` como referencia de organización y reutilización. Crear las piezas progresivamente según su responsabilidad y reutilizar los servicios y tipos existentes.

Para estilos, usar `docs/design/DESIGN.md` como fuente oficial del sistema de Google Stitch y `docs/design/references/` para las capturas de las cuatro vistas, manteniendo exclusivamente el tema claro. Consultar las discrepancias documentadas en la sección 6 de `docs/UI_ARCHITECTURE.md` antes de sustituir colores.

## 7. Ejecución de comandos y ahorro de tokens

El usuario será responsable de ejecutar manualmente los comandos de terminal.

El agente debe:

1. Inspeccionar archivos y modificar código según la tarea.
2. Indicar qué dependencias necesitan instalarse, sin instalarlas automáticamente.
3. Proporcionar los comandos necesarios para verificar los cambios.
4. Solicitar al usuario los resultados de las verificaciones cuando sean necesarios.
5. Analizar y corregir errores a partir de los resultados proporcionados.

**No ejecutar automáticamente:**
- `npm install`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npx cap sync`
- Comandos de Git que modifiquen el repositorio

**Excepción:** ejecutar comandos únicamente cuando el usuario lo autorice expresamente.

El objetivo es reducir el consumo de tokens y mantener el control de las verificaciones en manos del usuario.
