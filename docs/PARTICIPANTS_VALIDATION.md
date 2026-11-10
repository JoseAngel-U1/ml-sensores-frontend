# Fase 5-B — Validación de participantes

**Estado:** Fase 5-B completada y validada por el usuario en Xiaomi 11T. Confirmados typecheck, lint y build correctos, compilación/ejecución en Android, gestión de participantes funcional y rediseño aprobado. El agente realizó revisión estática; no ejecutó comandos ni pruebas en SQLite/Android.

El selector aprobado es una fila horizontal con desplegable y dos botones de iconos (+ y papelera). Se conservan las confirmaciones mediante `window.confirm`, los mensajes y el reintento existentes. No se implementarán toast por ahora.

## Verificaciones de código

Desde `ml-sensores/`, continuar solo si cada comando termina correctamente:

```bash
npm run typecheck
npm run lint
npm run build
npx cap sync android
npx cap open android
```

No se requieren dependencias nuevas. Actualizar la instalación existente sin desinstalar ni borrar sus datos para comprobar la migración real.

## Casos de aceptación

Se conserva el procedimiento como referencia para regresiones. La validación global del usuario no se interpreta como confirmación individual de los doce casos siguientes.

1. **Migración sin pérdida:** antes de actualizar, anotar UUID, fechas, métricas, estados y cantidades de capturas de ambos tipos. Cuando sea posible, conservar una lectura del JSON completo para compararla después. Tras actualizar, comprobar que `user_version` es 2, los mismos registros y mediciones siguen presentes y los entrenamientos históricos muestran «Sin participante (captura anterior)». No deben aparecer participantes creados automáticamente.
2. **Creación consecutiva:** en Entrenamiento, sin participantes, comprobar estado vacío y captura deshabilitada. Agregar y confirmar P-001; debe seleccionarse automáticamente. Agregar P-002; lista y selección deben actualizarse.
3. **Cancelar creación:** abrir Agregar y cancelar. La lista no cambia y la próxima confirmación propone el mismo código; no hay escritura ni consumo de secuencia.
4. **Doble pulsación/concurrencia:** pulsar Agregar repetidamente mientras se consulta/confirma/guarda. Solo una operación de la interfaz debe estar activa. En una prueba aislada del servicio, llamadas concurrentes a `createParticipant` deben devolver códigos distintos y ordenados por la cola.
5. **Eliminar sin capturas:** seleccionar un participante sin capturas, cancelar primero la confirmación y comprobar que permanece. Confirmar después: desaparece de la lista y se limpia la selección. No desaparece ninguna captura.
6. **No reutilizar códigos:** eliminar el código más alto sin capturas, cerrar/reabrir y agregar. El siguiente debe ser mayor que el eliminado. En un entorno de prueba sin capturas, repetir eliminando todos los participantes: la secuencia tampoco reinicia.
7. **Persistencia:** crear participantes y reiniciar la aplicación. Los participantes conservados deben reaparecer y el próximo código debe seguir la secuencia persistente.
8. **Entrenamiento:** seleccionar participante y actividad; iniciar preparación de 3 segundos y captura de 10. Selector y acciones deben estar bloqueados durante la sesión/guardado. La tarjeta de la captura guardada debe mostrar el participante fijado al iniciar y el UUID nuevo estable.
9. **Eliminar con capturas:** intentar eliminar ese participante. Debe mostrarse el motivo del bloqueo y conservarse tanto el participante como todas sus capturas, cualquiera que sea su estado de sincronización.
10. **Predicción:** realizar una captura; comprobar actividad null, ausencia de selector, guardado y recuperación normales. El objeto devuelto por `getRecordById` no incluye `participante_id`; su columna SQL es NULL.
11. **Reintento de guardado:** requiere un fallo de escritura controlado en un entorno de prueba o depurador (no borrar datos reales ni modificar UUID). Registrar la captura pendiente, provocar un rechazo de `saveRecord` y reintentar tras retirar el fallo. Deben conservarse UUID, participante, fecha y todas las mediciones; no usar «Nueva captura» para esta prueba. El selector permanece bloqueado durante el error para evitar eliminar el participante de la captura pendiente.
12. **Regresión de sensores y navegación:** repetir capturas en ambos módulos, navegar, cerrar/reabrir y probar en modo avión. Comprobar que siguen los 3 segundos de preparación y 10 de captura, que no se duplican sesiones y que no se exige una cantidad exacta de mediciones. Cambiar la selección después de una captura guardada no debe cambiar el participante de esa captura.

## Consultas opcionales de solo lectura en una herramienta SQLite

```sql
PRAGMA user_version;
PRAGMA foreign_keys;
PRAGMA foreign_key_check;
SELECT id, codigo FROM participantes ORDER BY id;
SELECT name, seq FROM sqlite_sequence WHERE name = 'participantes';
SELECT id, tipo, participante_id, estado_sync, json_array_length(mediciones)
FROM registros ORDER BY fecha;
```

`foreign_keys` es una propiedad por conexión: la herramienta externa puede tener otro valor que el servicio de la aplicación. Las pruebas de errores/concurrencia que no puedan realizarse con el entorno disponible deben reportarse como pendientes, no como aprobadas.

## Resultados

- `npm run typecheck`: correcto, confirmado por el usuario.
- `npm run lint`: correcto, confirmado por el usuario.
- `npm run build`: correcto, confirmado por el usuario.
- Compilación y ejecución de la aplicación en Xiaomi 11T: confirmadas por el usuario.
- Gestión de participantes: funcionamiento correcto confirmado por el usuario.
- Rediseño del selector: probado y aprobado por el usuario.
- Migración sobre una instalación existente y casos 1–12 por separado: sin resultados individuales confirmados; no se registran como ejecutados o aprobados individualmente.

**Cierre:** Fase 5-B completada por confirmación del usuario. La conectividad y sincronización, que eran las siguientes etapas al redactar este procedimiento, quedaron implementadas y validadas en 5-C a 5-D.3. Ambos módulos permiten ahora sincronización individual/masiva y eliminación local de registros pendientes. Este procedimiento sigue siendo una referencia de regresión de participantes, no un informe de ejecución individual de sus doce casos.

Para los casos que requieren inspeccionar una tarjeta, conservar la captura pendiente hasta terminar la comprobación: la vista Sincronizar ya no muestra registros sincronizados. Eliminar una captura pendiente no elimina automáticamente su participante; este solo puede eliminarse si no conserva ninguna captura local asociada, sincronizada o pendiente. Consultar [SQLITE_DESIGN.md](SQLITE_DESIGN.md) y [../WORK_STATUS.md](../WORK_STATUS.md) para el estado vigente.
