# WORK_STATUS — ML Sensores

## Estado general

**Etapa actual:** Fase 3 — Interfaz y captura, en progreso. Tareas 3.1 y 3.2 completadas; fases 1 y 2 completadas.

**Estado de la tarea:** 3.3 — Base visual compartida clara implementada, pendiente de verificaciones manuales y validación visual del usuario. La navegación de 3.2 fue validada por el usuario en navegador y Android, conservando las pruebas de sensores y SQLite.

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
- Tarea 3.1 completada: lógica de captura separada de `App.tsx` en el hook reutilizable `src/hooks/useSensorCapture.ts`, con funcionamiento validado por el usuario.
- Tarea 3.2 completada: navegación entre las cuatro rutas y pruebas existentes validadas por el usuario tanto en navegador como en Android.

## Verificación de la migración (2026-11-04)

- `npm run typecheck`: correcto para la aplicación y la configuración de Vite.
- `npm run lint`: correcto. Se excluyeron archivos generados de Android y se declaró `detener` antes de `iniciar` para resolver el diagnóstico de pureza de React Hooks, sin cambiar sus operaciones.
- `npm run build`: correcto; genera la aplicación web en `dist/`.
- Dependencias de desarrollo añadidas: `typescript`, `@types/node` y `typescript-eslint`. Los tipos de React y React DOM ya estaban instalados.
- Se conservan la duración objetivo de 10 segundos, el intervalo de comprobación de 100 ms, la validación de los seis valores finitos y el cálculo de frecuencia como total / duración real.
- La interfaz y los estilos se conservan. La carpeta nativa `android/` no se modificó.
- La instalación informó 12 vulnerabilidades moderadas; no se aplicaron actualizaciones ajenas a la migración.
- Migración validada en Xiaomi 11T según confirmación del usuario. Los 601 registros y 60.09 Hz documentados corresponden a la prueba de referencia anterior.

## Integración inicial de SQLite — validada

- Diseño aprobado documentado en `docs/SQLITE_DESIGN.md`.
- Versiones instaladas revisadas: Capacitor Core/Android/CLI 8.6.0 y `@capacitor-community/sqlite` 8.1.1.
- Tipos `Actividad`, `TipoRegistro`, `EstadoSync`, `Medicion` y `Registro` en `src/types/records.ts`, reutilizando `MedicionSensor`.
- Servicio `src/services/database.ts`: base `ml_sensores`, versión 1, tabla `registros` y su índice con el esquema aprobado.
- Funciones implementadas: `initializeDatabase`, `saveRecord`, `getRecords`, `getPendingRecords`, `getRecordById` y `markAsSynced`.
- Inicialización compartida, recuperación de conexión y operaciones encoladas para evitar aperturas duplicadas y transacciones superpuestas.
- Consultas parametrizadas; validación de UUID, fecha ISO UTC, tipo/actividad, duración/frecuencia positivas, estado pendiente y seis lecturas finitas por medición. Serialización/deserialización JSON con validación de filas recuperadas.
- Sección temporal independiente `src/components/DatabaseTest.tsx`: inicializar, guardar datos sintéticos con UUID generado en Android, consultar todos/pendientes y consultar por UUID mostrando JSON. Comprueba la igualdad de las mediciones tras guardar y recuperar.
- `src/App.tsx` incorpora la sección temporal; la lógica de captura de sensores se conserva.
- La implementación del agente no requirió modificaciones nativas de Android.
- Integración y persistencia en Android validadas según confirmación del usuario. Las verificaciones fueron responsabilidad del usuario; el agente no ejecutó comandos de instalación, tipos, lint, build, sincronización, pruebas ni Git en esta etapa.

## Decisiones aprobadas

- React + TypeScript.
- Capacitor para Android.
- SQLite como almacenamiento local.
- FastAPI como backend.
- MongoDB Atlas como base de datos remota.
- Sincronización manual de registros.
- Clasificación de quieto, caminando y corriendo.
- Procesamiento y predicción desde Python/Jupyter.

### Arquitectura aprobada de Fase 3

- Documento de referencia: `docs/UI_ARCHITECTURE.md`, con inventario del código existente, responsabilidades, estructura progresiva y diagrama Mermaid de navegación.
- Dos páginas principales: `TrainingPage` y `PredictionPage`; cada una tendrá vistas internas Captura y Sincronizar.
- React Router con cuatro rutas: `/entrenamiento`, `/entrenamiento/sincronizar`, `/prediccion`, `/prediccion/sincronizar`. `App.tsx` declara las rutas permitidas y la redirección de `/` y rutas desconocidas a `/entrenamiento`; navegación validada por el usuario en la tarea 3.2.
- `AppLayout` compartido: encabezado, navegación inferior y espacio para la vista activa. La ruta determinará la vista seleccionada.
- Organización por responsabilidades en `pages/`, `layouts/`, `shared/`, `components/capture/`, `components/records/`, `components/ui/`, `hooks/`, `services/` y `types/`, creada progresivamente.
- Reutilizar reloj, controles, tarjetas, listas, servicio SQLite y tipos actuales. Entrenamiento requiere actividad; predicción almacena `null`. Ambos capturan 10 segundos, generan UUID en el dispositivo y guardan localmente como pendientes.
- Lógica de sensores extraída de `App.tsx` a `useSensorCapture`, con conservación del funcionamiento validada por el usuario. La cuenta regresiva de 3 segundos se añadirá en una tarea separada.
- Tema exclusivamente claro, sin modo oscuro ni selector de temas. Fuente oficial de colores, tipografía, espaciados y estilos: `docs/design/DESIGN.md`. Capturas de las cuatro vistas: `docs/design/references/`.
- Las vistas Sincronizar mostrarán los registros locales de su tipo; la sincronización manual real con FastAPI sigue correspondiendo a la Fase 4.

### Estado real de Fase 3

- Arquitectura y tareas verificables documentadas; hook de la tarea 3.1 validado. Creadas las dos páginas provisionales y estructura compartida de navegación; el diseño definitivo sigue pendiente.
- La captura permanece en `src/hooks/useSensorCapture.ts`. La interfaz de prueba se trasladó a `src/components/CaptureTest.tsx`, que consume el hook e incluye `DatabaseTest`; está accesible en Captura de Entrenamiento.
- `App.tsx` declara rutas y `main.tsx` configura `BrowserRouter`. La base visual compartida de 3.3 está implementada y pendiente de validación; las vistas definitivas siguen pendientes.
- Dependencias de navegación ya declaradas en `package.json`: `react-router-dom: ^7.18.5` y `@capacitor/app: ^8.1.2`. No se añadieron dependencias para el tema visual.
- Las muestras completas ya se exponen en `resultado.mediciones`. Antes de integrar el guardado real, quedan por definir las métricas numéricas sin redondear, el tratamiento de muestras incompletas y la política de navegación durante captura.
- La tarea 3.1 modificó hook, consumo en App y el tipo de resultado; el usuario confirmó que las pruebas funcionan correctamente. El agente no ejecutó comandos ni verificaciones de código.
- Sistema de Stitch y cuatro capturas disponibles y referenciados. Functional Palette tiene prioridad definitiva; se corrigieron en el YAML los tokens `background`, `surface`, `primary`, `on-background` y `on-surface`. Los roles adicionales sin equivalencia confirmada se conservan y se interpretarán solo si se utilizan, según la sección 6 de `docs/UI_ARCHITECTURE.md`. La base visual está lista para implementar; el orden y estado de las tareas de Fase 3 se conservan.

## Validación completada

### Validación de SQLite en Android

**Resultado:** Validación confirmada por el usuario: guardado, recuperación por UUID y JSON, persistencia tras cerrar/reabrir y conservación de la captura de sensores.

**Comandos de referencia para futuras verificaciones (desde `ml-sensores/`):**
```bash
npm run typecheck
npm run lint
npm run build
npx cap sync android
npx cap open android
```

El procedimiento de referencia está en `docs/SQLITE_DESIGN.md`: prueba en modo avión, guardado y consulta por UUID, cierre y reapertura, revisión del JSON recuperado y captura de sensores de 10 segundos.

**Restricciones de la etapa SQLite ya completada:**
- No recrear el proyecto.
- No eliminar ni reinicializar Android.
- No avanzar a FastAPI, MongoDB ni pantallas definitivas.
- No modificar la funcionalidad de captura.

**Criterios de aceptación:**
Validación registrada según confirmación del usuario.

- [x] TypeScript, lint y build correctos después de integrar SQLite.
- [x] Base inicializada en Android y registro guardado.
- [x] Recuperación por UUID y mediciones JSON correctas.
- [x] Persistencia después de cerrar y reabrir, sin conexión.
- [x] Captura de sensores de 10 segundos conservada.

## Bloqueos

La discrepancia de precedencia de colores está resuelta: prevalece Functional Palette y las equivalencias claras del YAML están corregidas. No hay bloqueo por la paleta aprobada ni faltan el documento de Stitch o las cuatro capturas. Los tokens adicionales sin equivalencia confirmada requieren interpretación únicamente si se utilizan.

## Tarea 3.1 — Completada y validada por el usuario

- Creado `src/hooks/useSensorCapture.ts`: estados, eventos `devicemotion`, búfer de muestras, temporización y cálculo de resultados extraídos de App.
- Interfaz pública: `estado`, `segundos`, `resultado: ResultadoCaptura | null` e `iniciar(): void`. La finalización es automática; no se expone una acción de parada anticipada.
- Ampliación mínima de `ResultadoCaptura`: `mediciones: MedicionSensor[]`, instantánea completa al terminar (incluye muestras incompletas). Se limpia el resultado al iniciar otra sesión; no hay historial ni persistencia de capturas reales.
- Conservados 10000 ms objetivo, comprobación cada 100 ms, `performance.now()`, seis lecturas, validación finita, frecuencia total/duración real y formato de dos decimales.
- Inicios repetidos ignorados por una referencia de captura activa, antes del siguiente render. Cada sesión registra un listener y un intervalo; los renders no los duplican. Solo se monta una instancia en App.
- Al finalizar se retiran listener/intervalo y se limpian referencias temporales, conservando la instantánea del resultado. Al desmontar se descarta la captura activa sin publicar un resultado parcial ni actualizar estado. El efecto admite el ciclo de montaje/limpieza de StrictMode.
- Diferencia interna: antes el listener permanecía registrado mientras App estaba montado; ahora existe únicamente durante la sesión. Los tiempos y la presentación se conservan; el usuario confirmó que la captura sigue funcionando correctamente en Android.
- `database.ts`, `DatabaseTest.tsx`, estilos y Android no se modificaron. No se añadieron dependencias.

### Validación confirmada y referencia para futuras verificaciones

El usuario confirmó el funcionamiento correcto de las pruebas y el cierre de la tarea 3.1. Se conserva el siguiente procedimiento como referencia para futuras verificaciones, no como pendiente de esta tarea.

Comandos desde `ml-sensores/`, continuando solo si cada comando termina correctamente:

```bash
npm run typecheck
npm run lint
npm run build
npx cap sync android
npx cap open android
```

En Xiaomi 11T: iniciar y esperar aproximadamente 10 segundos; comprobar botón deshabilitado, estados, duración real, total, válidas/incompletas, frecuencia y primera/última medición. Repetir varias sesiones para comprobar el reinicio y que los resultados no sigan cambiando al finalizar. Verificar que pulsaciones rápidas no reinicien ni superpongan sesiones. Revisar la lista completa en el log existente «Mediciones capturadas» y su correspondencia con el total.

Revisar también el desmontaje durante una captura (mediante React DevTools o un consumidor de prueba temporal del usuario): no debe quedar listener/intervalo ni publicarse un resultado parcial. Cerrar/reabrir la aplicación sirve como prueba adicional de reinicio, pero no sustituye comprobar la limpieza del hook al desmontarse. Comprobar que la sección SQLite sigue operativa. No se exige una cantidad fija de mediciones ni exactamente 60.09 Hz.

**La tarea 3.1 queda completada y validada según confirmación del usuario.** El agente solo realizó revisión estática; no ejecutó tipos, lint, build ni pruebas.

## Tarea 3.2 — Completada y validada por el usuario

### Cambios realizados

- `src/App.tsx`: las cuatro rutas aprobadas bajo `AppLayout`, con `Navigate replace` para `/` y rutas desconocidas. La redirección reemplaza la entrada inválida para evitar bucles al retroceder.
- `src/main.tsx`: `BrowserRouter` usa el historial del navegador y mantiene URLs sin fragmentos `#`.
- `src/pages/TrainingPage.tsx` y `src/pages/PredictionPage.tsx`: dos páginas con vistas internas determinadas mediante la ruta activa (`useMatch`); enlaces `NavLink` con coincidencia exacta para Captura/Sincronizar.
- `src/layouts/AppLayout.tsx`: Header, un único contenido principal con `Outlet` y BottomNavigation. No incluye sensores ni SQLite.
- `src/shared/Header.tsx`: nombre ML Sensores. `src/shared/BottomNavigation.tsx`: enlaces entre módulos y estado activo derivado de Router, incluso en las subrutas Sincronizar.
- `src/components/CaptureTest.tsx`: interfaz de la prueba anterior, trasladada desde App; mantiene botón, temporizador, métricas, primera/última medición y `DatabaseTest`. Adaptado su contenedor al tema claro y al contenido principal del layout.
- `src/hooks/useAndroidBackNavigation.ts`: escucha `backButton` de `@capacitor/app` solo en Android; usa `navigate(-1)` cuando `canGoBack` es verdadero y `App.exitApp()` cuando no hay historial. Libera únicamente su listener, incluso si el registro asíncrono termina después de la limpieza de StrictMode.
- `src/index.css`: estilos mínimos de layout, navegación activa/foco y legibilidad; eliminado el cambio automático a modo oscuro. Sin diseño completo de Stitch ni bibliotecas visuales.
- Las vistas Sincronizar y Captura de Predicción son provisionales con información de su estado pendiente. No implementan nuevas capturas, listados definitivos ni envío de registros.

### Conservación de la prueba y navegación durante captura

La prueba funcional solo se monta en `/entrenamiento`. Cambiar de vista o módulo desmonta `CaptureTest`: el hook validado retira listener/intervalo y descarta la captura temporal sin guardarla. Al volver, los estados de prueba empiezan de nuevo. El aviso aparece en la interfaz. Los registros ya guardados mediante `DatabaseTest` permanecen en SQLite; basta consultarlos otra vez al regresar.

No se modificaron `useSensorCapture.ts`, `database.ts`, `DatabaseTest.tsx` ni archivos nativos de Android. No se duplicó la lógica de captura ni se conectaron capturas reales con SQLite.

### Dependencias y comandos manuales

Dependencias incorporadas por el usuario: `react-router-dom` versión mayor 7 y `@capacitor/app` versión mayor 8, alineada con Capacitor 8. El plugin App se utiliza para el botón Atrás físico. No se requieren paquetes de tipos adicionales para Router.

Comandos de referencia de la tarea 3.2 (instalación ya realizada por el usuario; no es necesario repetirla para 3.3):

```bash
npm install react-router-dom@7 @capacitor/app@8
npm run typecheck
npm run lint
npm run build
```

Para validar navegación en navegador:

```bash
npm run dev
```

Para Android, después de compilar:

```bash
npx cap sync android
npx cap open android
```

La sincronización registra el plugin App y copia el build; no editar archivos nativos manualmente. El agente no ejecutó instalaciones, comandos de Git, tipos, lint, build ni pruebas; solo realizó revisión estática.

### Validación confirmada por el usuario

- [x] Navegación entre las cuatro rutas validada en navegador.
- [x] Navegación validada en Android.
- [x] Acceso y funcionamiento de las pruebas de sensores y SQLite conservados.

La confirmación corresponde al usuario; el agente no ejecutó las verificaciones. Los cambios visuales posteriores de 3.3 requieren una nueva revisión de regresión.

Limitaciones: SQLite sigue requiriendo Android; navegador permite revisar navegación y estructura pero no valida persistencia nativa. `BrowserRouter` necesita que un alojamiento web de producción devuelva `index.html` para rutas de la SPA; Vite dispone de fallback durante desarrollo, y la recarga de subrutas en Capacitor debe verificarse en el dispositivo. La conexión del botón Atrás exige instalar y sincronizar `@capacitor/app`; cualquier fallo de registro se informa en consola.

**La tarea 3.2 queda completada en ROADMAP.md según confirmación del usuario.** La Fase 3 permanece en progreso.

## Tarea 3.3 — Tema claro compartido implementado, pendiente de validar

### Base visual

- `src/index.css`: centraliza la paleta oficial en `--color-background`, `--color-surface`, `--color-primary`, `--color-primary-soft`, `--color-text`, `--color-text-secondary` y `--color-on-primary`.
- Tokens complementarios tomados del cuerpo de DESIGN.md: borde `#DCE7DF`, hover primario `#0D532E`, colores de aviso, radios de controles de 4 px y tarjetas de 8 px, sombras sutiles y escala de espaciado de 2 a 48 px. No se reinterpretaron los tokens ambiguos del YAML.
- Tipografía: familias `Space Grotesk` para interfaz y `JetBrains Mono` para datos, con alternativas locales de sistema; tamaños responsivos y cifras tabulares en tiempo/JSON. No se añadieron fuentes remotas ni dependencias visuales.
- `AppLayout` recibe el estilo mediante sus clases existentes: fondo claro, contenido adaptable hasta 1440 px y barras sticky en el flujo del documento. Márgenes móviles de 16 px, tablet de 24 px y escritorio de 40 px.
- `Header`: identidad ML Sensores, marca SVG decorativa no interactiva, línea verde y separación consistente. Sin menú ficticio ni selector de temas.
- `BottomNavigation`: conserva los dos NavLink, sus rutas y estado activo; incorpora iconos SVG locales, etiquetas visibles y estilos de foco/hover/selección sin cambiar la lógica de navegación.
- Controles de vistas, botones, campos y superficies comparten estilos. Estados hover, active, focus-visible y disabled; objetivos táctiles mínimos de 44 px. Las transiciones y el escalado al pulsar se desactivan con reducción de movimiento.
- Vistas provisionales con `.surface-card` y texto secundario. `CaptureTest` usa las clases compartidas en lugar de estilos en línea para botón, resultados y JSON. El comportamiento de la prueba se conserva.
- `index.html`: idioma español y `viewport-fit=cover`; CSS contempla insets superior, inferior, izquierdo y derecho, y reserva de desplazamiento para el foco. No se deshabilita el zoom ni se modifican archivos nativos Android.

### Alcance y diferencias respecto a Stitch

- Se revisaron las cuatro capturas y sus HTML. La arquitectura aprobada conserva dos módulos inferiores y dos vistas internas; las referencias muestran cuatro accesos inferiores. No se agregaron rutas ni módulos para reproducir esa diferencia.
- Se sigue DESIGN.md para radios, espaciados y familias tipográficas, aunque algunos HTML usan Inter, radios mayores y otros márgenes. No se reproduce la barra ficticia de hora/batería ni el menú lateral de las capturas.
- Iconos SVG locales simplificados en lugar de Material Symbols descargado de Google. Sin Tailwind, librerías de componentes ni recursos visuales de red.
- No hay archivos de Space Grotesk ni JetBrains Mono empaquetados en el proyecto. Las familias están declaradas y se usarán si están instaladas; en Android normalmente se verán las alternativas del sistema. Para fidelidad tipográfica exacta offline faltan los archivos de fuente y su licencia para incorporarlos localmente en una tarea autorizada.
- Se mantienen las pruebas temporales y los textos provisionales. No se implementaron reloj circular, selector de actividad, controles definitivos, tarjetas/listas de registros, cuenta regresiva, guardado real ni sincronización.
- No se modificaron los hooks de captura/navegación, `database.ts`, `DatabaseTest.tsx`, el mapa de rutas ni dependencias. El CSS compartido sí estiliza los controles existentes de la prueba SQLite.

### Verificación manual pendiente de 3.3

El agente realizó revisión estática; no ejecutó instalaciones, compilación, lint, pruebas ni Git. Ejecutar manualmente desde `ml-sensores/`:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

Para actualizar y probar Android después del build:

```bash
npx cap sync android
npx cap open android
```

- [ ] Verificar las cuatro rutas, redirecciones y navegación sin regresiones; comprobar Atrás en navegador y Android.
- [ ] Revisar colores, superficies, textos, botones y selección activa de las dos barras de navegación en todas las vistas.
- [ ] Revisar anchos de 320/360/390 px, tablet y escritorio; aumentar texto/zoom, comprobar que etiquetas, UUID y JSON no provocan desbordamiento de toda la página.
- [ ] Probar foco por teclado y controles habilitados/deshabilitados (captura y fieldset SQLite), hover en escritorio y pulsación en móvil.
- [ ] Comprobar que el tema permanece claro con la preferencia del sistema en oscuro y que reducción de movimiento elimina transiciones/escalado.
- [ ] En Xiaomi 11T, revisar áreas seguras, gestos/botones del sistema, orientación horizontal y campo UUID con el teclado abierto; ningún control debe quedar inaccesible.
- [ ] Repetir captura de 10 segundos y prueba SQLite en modo avión; comprobar legibilidad de resultados, consulta del UUID y persistencia.
- [ ] Validar visualmente las diferencias documentadas, especialmente las fuentes alternativas locales.

**3.3 permanece sin completar hasta la confirmación del usuario.** Siguiente paso: validar esta base visual antes de abordar los componentes definitivos de 3.4.
