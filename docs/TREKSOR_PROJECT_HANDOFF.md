# TREKSOR — PROJECT HANDOFF
**Referencia de continuidad técnica, funcional, estética y operativa**
**Versión documental inicial:** 2026-11-15
**Ámbito:** app iPhone, sitio web, backend, Studio/Admin, Supabase, Railway, Git Bash/Windows, Expo/EAS, Treksor Dev, Apple Watch y desarrollo de negocio.
**Estado de esta edición:** únicamente documentación en una rama separada; no equivale a un merge, despliegue ni actualización del iPhone.

> **Regla suprema:** Treksor se continúa, no se reconstruye. Proteger lo que funciona, The Architect y la organización de Ecosystem. Cambiar únicamente lo solicitado. Nunca eliminar una función para hacer desaparecer un error.

## 0. Cómo leer este archivo y qué es fuente de verdad

Este archivo reúne dos capas **deliberadamente diferenciadas**:
1. **Estado GitHub verificado y matices operativos** (esta sección 0–4), basado en lectura de GitHub y documentación técnica disponible al 15 de noviembre de 2026. La existencia de código no prueba ejecución ni despliegue.
2. **Documento maestro original de continuidad** (sección 5), facilitado por el responsable del producto el 15 de noviembre de 2026, conservado **íntegramente y sin alterar** para preservar reglas, visión, decisiones, contexto técnico e historial. Las afirmaciones sobre estados pasados se interpretan como el estado informado en la fecha de origen, no como certificación en tiempo real.

Cuando haya tensión entre ambas capas: **la visión, reglas y organización del producto las determina el documento maestro y las instrucciones explícitas actuales del responsable**; el estado técnico verificable se determina por el commit, la rama, los PR, el código, las pruebas y el entorno de ejecución efectivamente inspeccionados. No corregir divergencias mediante cambios no solicitados.

**Para retomar en cualquier otro chat:** primero leer este archivo entero en la rama de documentación, verificar los SHA actuales y el estado de PR, comprobar por separado el estado del Git Bash local, la instalación de Treksor Dev y los despliegues; luego esperar una solicitud concreta antes de cambiar nada. Un handoff no concede permiso implícito para reparar, refactorizar, fusionar o publicar.

## 0.1 Actualización confirmada — Home, 15/11/2026, 18:33 Australia/Brisbane

**Código preparado y comprobado; pendiente de aplicar y probar en el iPhone.**

- Solicitud del responsable: cuatro pilares en Home como tarjetas deslizables horizontalmente, con una transición armoniosa y moderna.
- Rama: `design/home-pillar-slider-20261115`, creada desde `audit/mobile-web-parity-20261115` en `9e5f726df293bffbfd789a79ef8eb06783b36c05`.
- Commit: `b9b36b872e90d0ffda22151b8b27f63d6016c3a7`. [PR #16](https://github.com/treksorapp-cmd/TreksorApp/pull/16), abierto como borrador, sin fusionar.
- Único archivo de aplicación modificado: `app/(tabs)/home/index.tsx`. Carrusel con siguiente tarjeta visible, ajuste por tarjeta, animación nativa de escala/opacidad, cuatro indicadores pulsables de 44 puntos, conservación de selección al cambiar el ancho, espacio final correcto para Purpose, respeto de Reducir movimiento y más altura con texto ampliado. Se conservan imágenes, identidad The Architect, orden, iconos, rutas y los demás accesos de Home.
- Pruebas: `npm run release:check` completo, TypeScript y `git diff --check` correctos. Prueba adicional del componente real con estado React y host nativo simulado: 320/375/390/430/768 puntos, selección, rutas, arrastres lentos, límites, cambio de ancho y Reducir movimiento. La captura con navegador local no pudo realizarse por restricciones del entorno; **no hay validación visual/gestual en iPhone**.
- El parche con `git diff --unified=1` pasó `git apply --check` contra el Home remoto de `feature/unified-journey-progress-2026` en `a9febfee`. Esto **no verifica** el archivo actual de Windows.
- Próximo paso: obtener `git status --short --branch`, último commit y hash de Home desde `~/TreksorApp`, y trasladar únicamente el parche del carrusel, con respaldo local previo. No reemplazar Home entero por el de auditoría ni integrar las otras ramas para esta tarea.
- No se modificaron dependencias, Expo/EAS ni servicios; no hubo merge, despliegue, compilación o reinstalación. Esta rama documental no incorpora el código del PR #16. Recuperación: revertir únicamente el commit del carrusel; para Windows, conservar y recuperar la copia previa del archivo.

### 0.2 Adaptación a la copia Windows verificada — 15/11/2026

La captura aportada por el responsable muestra `~/TreksorApp` en `feature/unified-journey-progress-2026`, HEAD `d1ddafc`, sin MERGING y con `package.json`/`package-lock.json` modificados, además de archivos de diagnóstico sin seguimiento. La salida informa 2 commits por delante y 4 por detrás de su referencia remota local; no interpretar esto como permiso para hacer pull o merge.

**Home realmente usado en Windows:** blob `22933d71dfa58a67a2735bd6d7c00114e27916da`, recuperado íntegramente por ese hash. Esta versión tiene una cuadrícula de pilares, `PillarUpdates` compacto dentro de cada tarjeta y `DiscoveryCard`/`JourneyCard` debajo. **No coincide con el Home avanzado ni con el blob usado en el primer ensayo de portabilidad de 0.1.** No aplicar el diff original del PR #16 directamente a esta copia.

Se preparó `patches/home-pillar-slider-windows-20261115.patch` en el commit `859902abefdf6110daac1ae648aa715b3bd5527e` de la misma rama del PR #16. Modifica exclusivamente Home: incorpora el carrusel probado y conserva Discovery, Journey, novedades por pilar y el resto del contenido local. Resultado esperado del archivo: blob `c8c2ad77c0bfe4e19b5855a8cf592a315ad40969`. El Home avanzado del PR sigue intacto; este archivo .patch es una vía de aplicación específica, no una reversión de la rama avanzada.

Validación: aplicación y comprobación del parche con LF y con CRLF/`core.autocrlf=true`; reversión comprobada; TypeScript del Home compatible contra los tipos existentes; prueba React de cinco anchos, indicadores, rutas, límites, cambio de ancho y Reducir movimiento. Se comprobó además que siguen montados DiscoveryCard, JourneyCard y los cuatro PillarUpdates compactos. La versión avanzada `b9b36b8` ya había pasado también GitHub Actions.

**Pendiente:** ejecutar en Windows el bloque con comprobación del hash de origen, fetch de la rama sin merge, `git apply --check`, copia de respaldo externa al repositorio, `git apply` y verificación del hash final; después recargar Expo y validar en el iPhone. No se afirma que esté aplicado ni visualmente probado hasta recibir el resultado. Preservar las modificaciones locales de dependencias. No usar checkout del Home avanzado ni reemplazar toda la app. El respaldo local del archivo permitirá recuperar exactamente la versión anterior.

## 1. Snapshot de GitHub verificado — 15 de noviembre de 2026

**Repositorio principal móvil/web:** https://github.com/treksorapp-cmd/TreksorApp
- Rama predeterminada: **develop**, SHA **cae45c3a47fb29750c03fd10b7e18e751c47d567** (no usar como referencia del código más avanzado).
- Base histórica de lanzamiento: **release/treksor-1.1.0**, SHA **36dd41de9b1b57b950533a22b616dd84c2de2eaa**.
- Rama integradora: **integration/treksor-unified-20261114**, SHA **bc7ce8ff1c00778d75814e5cd1a2f815751767fe**, último commit observado el 2026-11-15 03:16 UTC: recordatorios locales opcionales para Quick Notes. [PR #14](https://github.com/treksorapp-cmd/TreksorApp/pull/14): **abierto, borrador, sin fusionar**; base: feature/unified-journey-progress-2026.
- **Punta más reciente verificada de la línea integrada:** **audit/mobile-web-parity-20261115**, SHA **9e5f726df293bffbfd789a79ef8eb06783b36c05**, último commit observado el 2026-11-15 03:32 UTC: actualización del contrato de paridad. [PR #15](https://github.com/treksorapp-cmd/TreksorApp/pull/15): **abierto, borrador, sin fusionar**; base: integration/treksor-unified-20261114.
- Comparación verificada: **audit/mobile-web-parity-20261115** está **26 commits por delante, 0 detrás** de integration/treksor-unified-20261114 y **531 commits por delante, 0 detrás** de develop. No significa que esté instalado ni publicado.
- Ramas históricas/dependientes relevantes: **feature/today-daily-loop-20261112** (PR #6), **feature/connected-pillars-20261112** (PR #7), **feature/retention-and-premium-validation-20261112** (PR #8), **feature/shared-goals-watch-ready-20261112** (PR #9), **feature/unified-journey-progress-2026** (PR #12), **design/pillar-icons-identity-2026** (PR #11), **fix/mentor-session-safety-2026** (PR #10), **fix/alarmkit-linker-eas-2026**, más PR #1–#5 de diseño y funciones previas.
- Se revisó el inventario de ramas. **No se identificó una rama de integración posterior a la auditoría del 15 de noviembre** en esta revisión; volver a comprobarlo antes de cada modificación. La rama documental creada a partir de ese SHA **no es una versión desplegada ni una nueva línea de funcionalidades**.

**Backend:** https://github.com/treksorapp-cmd/TreksorBackend
- Predeterminada: **release/rc1**, SHA **238af66acb17161aad38e65de9d189afdfffaff5**; **develop**: **5e6f675633b04f8d401545cc4b16227541a120c6**.
- release/rc1 está **11 commits por delante** de develop (no realizar cambios basados en develop sin comparar). No había PR abiertos en la revisión.

**Admin:** https://github.com/treksorapp-cmd/TreksorAdmin
- Predeterminada: **release/rc1**, SHA **8b9960d50fb4b4d537037e11a97011b584bc45ef**; **develop**: **e1f4febab2c14e64fd24fa53e66de2026d863d30**; release/rc1 está **7 commits por delante** de develop.
- **backend/supabase-foundation**, SHA **489253ea44b0d164386887f4e0ab5bff99ff64b8**; PR #1: abierto y borrador.
- **design/architect-brand-unification**, SHA **7f06f912ac32355f964c0098ef3ac16234c9e1d3**, **14 commits por delante de release/rc1**; PR #2 abierto, no fusionado.
- **fix/architect-supabase-integration-2026**, SHA **0da58d8a59a1e21ee4df8573df88e3f8b05b0b34**; PR #3 abierto, no fusionado.
- No confundir avance de diseño o migraciones en ramas con un Admin operativo en producción.

**Repositorio adicional:** https://github.com/treksorapp-cmd/Treksor — aparecía vacío en la verificación; no tomarlo como origen del código activo.

### Evidencia técnica y archivos a consultar antes de intervenir

- [Auditoría de sincronización móvil/web 2026-11-15](https://github.com/treksorapp-cmd/TreksorApp/blob/audit/mobile-web-parity-20261115/docs/WEB_MOBILE_SYNC_AUDIT_2026-11-15.md)
- [Contrato de paridad entre dispositivos](https://github.com/treksorapp-cmd/TreksorApp/blob/audit/mobile-web-parity-20261115/docs/CROSS_DEVICE_PARITY.md)
- [Identidad compartida y resultados](https://github.com/treksorapp-cmd/TreksorApp/blob/audit/mobile-web-parity-20261115/docs/shared-identity-and-outcomes.md)
- [Contrato histórico/preparatorio de Apple Watch](https://github.com/treksorapp-cmd/TreksorApp/blob/audit/mobile-web-parity-20261115/docs/apple-watch-integration.md) — su descripción «sin target watchOS» es anterior a cambios nativos posteriores; revisar rama y targets actuales, no tratarla como inventario actualizado.
- [Community, seguridad y puertas de lanzamiento](https://github.com/treksorapp-cmd/TreksorApp/blob/audit/mobile-web-parity-20261115/docs/community-and-launch-gates.md)
- [Auditoría de diseño Admin](https://github.com/treksorapp-cmd/TreksorAdmin/blob/design/architect-brand-unification/docs/TREKSOR_DESIGN_SYSTEM_AUDIT.md)
- [Tokens móviles The Architect](https://github.com/treksorapp-cmd/TreksorApp/blob/audit/mobile-web-parity-20261115/theme/architect.ts), [iconos canónicos](https://github.com/treksorapp-cmd/TreksorApp/blob/audit/mobile-web-parity-20261115/lib/pillar-navigation.ts), [configuración Expo](https://github.com/treksorapp-cmd/TreksorApp/blob/audit/mobile-web-parity-20261115/app.config.js), [perfiles EAS](https://github.com/treksorapp-cmd/TreksorApp/blob/audit/mobile-web-parity-20261115/eas.json), [README sitio web](https://github.com/treksorapp-cmd/TreksorApp/blob/audit/mobile-web-parity-20261115/web/treksor-community/README.md).

## 2. Identidad, organización y estados: precisión obligatoria

### Identidad de producto — NO REDISEÑAR

**TREKSOR**: sistema premium y práctico de desarrollo personal masculino; discreto, confiable, elegante y orientado a resultados, sin frases vacías ni interfaces saturadas. Identidad **The Architect**. Cuatro pilares, siempre en este orden: **Body** (mancuerna), **Mind** (cerebro), **Balance** (hoja), **Purpose** (brújula). **Workout y Nutrition dentro de Body**, nunca como pilares. **Today, Mentor, Progress y Community** son herramientas transversales. **Today** tiene sección propia; **Home** conserva carrusel premium de cuatro pilares; **Goals, Connected Journey y Weekly Review** van dentro de **Progress**.

**Ecosystem** denomina la arquitectura integrada de crecimiento personal y **su estructura no debe reorganizarse**. No significa ecología/reciclaje. El sitio conserva la ruta **#/ecosystem**; una auditoría de diseño también establece **Your Journey** como agrupación visible para el usuario. Esto no autoriza a renombrar ni reubicar nada: verificar el contexto de cada interfaz y solicitar autorización para cualquier cambio de nomenclatura o navegación.

**Paleta móvil verificada directamente en theme/architect.ts:** fondo **#05080D**, superficie **#0B1017**, superficie elevada **#121922**, oro **#D7B877**, texto principal **#F5F4F1**, secundario **#C8C3BA**, discreto **#A5AAAF**. Estados funcionales ya definidos: éxito **#ACD6C0**, peligro **#E7A3A0**. Jerarquía móvil existente: page 34/42, section 22/29, card 18/25, body 15/23, caption 12/18; no variar globalmente.

**Familia web/admin documentada:** fondo **#02050C**, superficie **#111820**, elevada **#19222C**, oro **#D7B877**, marfil **#F5F4F1**, muted **#A5AAAF**. **No homogeneizar arbitrariamente plataformas sustituyendo tokens móviles por los de web/admin ni viceversa**. Mantener iconografía de línea coherente. La web documenta Manrope; el código Expo tiene configurada la fuente Nunito en un plugin: verificar uso real antes de alterar tipografía; la marca seleccionada The Architect prevalece como criterio de diseño sin inventar migraciones de fuentes.

**Fotografía y contenidos:** imágenes fotográficas reales, fuentes y licencias comerciales verificables; hombres como protagonistas del material editorial, sin rostros reconocibles mirando directamente a cámara; portada única y pertinente por artículo; no reemplazar por IA sin autorización. Un Power Thought diario y dos Articles semanales son **objetivos editoriales**, no prueba de publicación automática efectiva.

### Matriz realista de funcionalidades — snapshot, no promesa de producción

| Área | Confirmado en código o auditoría | Pendiente / no afirmar |
| --- | --- | --- |
| Identidad | Un proyecto Supabase Auth común, ID de usuario auth.users.id; roles de Admin separados | Inicio de sesión conjunto real en dos dispositivos, social login equivalente y sesiones E2E |
| Body / Workout | Planes, series, pesos, repeticiones y tracking en el móvil; snapshots app_progress por usuario/dispositivo | Editor completo de entrenamientos web↔app, IDs canónicos, conflictos y borrado bidireccional |
| Body / Nutrition | Lista de compras móvil y web con CRUD y RLS en la rama PR #15 | Despliegue público, sincronización autenticada E2E, nutrición/energía funcionalmente equivalente |
| Today | Prioridad, tres acciones, reflexión y fechas de completitud; eventos mínimos fecha-only con RLS/idempotencia | Lo nuevo en PR #15 no desplegado/verificado; no sincronizar textos íntimos ni fabricar check-ins locales |
| Mind / Balance / Purpose | Flujos y herramientas distribuidos en pilares, metas, reflexiones y prácticas | Paridad web completa; métricas basadas en actividad real, no navegación |
| Progress | Resúmenes locales, Goals, Connected Journey, Weekly Review; web lee snapshots por dispositivo | Editor web de progreso y restauración/conciliación multi-dispositivo completa |
| Mentor IA | UI y modos conversacionales móviles; protección de sesión en ramas | Datos únicamente autorizados y actuales, validación end-to-end, no inventar progreso |
| Mentores humanos | Directorio/invitaciones/comunidad web | No confundir con el Mentor IA; servicios e interfaces no equivalentes |
| Community | Eventos/RSVP y feedback en rama; componentes web de grupos y conexiones | Moderación/seguridad/host, paridad de acciones, filtración potencial de meeting_point a revisar; no inventar eventos |
| Quick Notes | Notas/tareas locales y recordatorios opcionales con notificaciones locales | Sincronización privada cloud por consentimiento y web equivalente no desarrolladas/verificadas |
| Hábitos semanales | Planificación local móvil | Sincronización bidireccional y UI web equivalente |
| Apple Watch / Health / Wake | Módulos/targets nativos, contratos y puente parcial; perfil EAS device dev | Funciones watchOS completas, permisos, builds físicos, no duplicación y app instalada verificadas |
| Admin editorial | Artículos/pensamientos vía servicio editorial; ramas de diseño y Supabase | API de edición real, migración segura, calendario de publicación, analytics y publicación end-to-end comprobados |
| Premium | Investigación de valor, RevenueCat y caminos de suscripción | Ofertas, precios, derechos/restauración y paywall validados antes de comercializar |

**Veredicto de la auditoría del 15/11:** App, web y watch **NO están completamente sincronizados, NO son funcionalmente equivalentes y NO han superado E2E autenticado de dos clientes**. PR #15 agrega **código fuente** para fechas Today y Grocery list; no despliega por sí mismo el sitio **https://treksor-community.oceanicman.chatgpt.site**. La web está en **web/treksor-community/dist/** de TreksorApp. El Admin en Railway es un servicio diferente; ni un commit, ni Railway, ni una compilación EAS, ni GitHub actualizan automáticamente la app instalada.

**Supabase:** proyecto **niakfwerfqmrmhuypkpd**. La auditoría histórica informa RLS en app_progress, treksor_sync_events y nutrition_groceries; propietario mediante auth.uid(); eventos Today de fecha mínima idempotentes. No se efectuó inspección en vivo de Supabase al redactar este handoff. Alertas de seguridad documentadas para revisar antes de lanzar: protección de contraseñas filtradas desactivada, posible exposición de community_events.meeting_point por la tabla original, permisos y visibilidad pública de repositorios. **No ejecutar migraciones, dar privilegios admin a usuarios comunes ni cambiar visibilidad/repositorios por esta documentación.**

## 3. Operación segura — Windows, Expo/EAS y iPhone

- **PC:** el responsable trabaja con **Git Bash en Windows**; cuando haga falta, proporcionar **comandos exactos uno a uno**, pedir salida y evaluar antes de continuar. No hay acceso implícito del asistente al disco de Windows. Ruta de carpeta local **no verificada**.
- **Diagnóstico inicial de solo lectura:** pwd; git status; git branch --show-current; git branch -a; git log -1 --format="%H %cs %s"; git remote -v; git diff --stat; git log --oneline --decorate -15. git fetch origin --prune solo tras confirmar que sea apropiado. Nunca suponer que actualizar GitHub actualiza Windows.
- **Advertencia MERGING:** una auditoría anterior informó un merge pendiente en la carpeta local. **No se verificó nuevamente**. Si aún existe: no git pull, checkout forzado, reset --hard, clean -fd, completar/abortar merge ni instalar/reconstruir sin investigar el estado y preservar cambios.
- **Treksor Dev iPhone, configuración fuente verificada:** Expo owner **treksorapps-team**, EAS project dev **14f7500b-1aba-4cea-9c2b-ded2c67821e2**, nombre **Treksor Dev**, bundle **com.treksor.dev**, perfil **iphone-dev** con developmentClient=true, distribution=internal, simulator=false, imagen macos-sequoia-15.6-xcode-26.2. Producción usa bundle **com.treksor.prod** y otro EAS project. **No modificar, recompilar, reinstalar ni borrar la app instalada por iniciativa propia**.
- El registro Xcode del 14/11 mostró **ld: framework 'AlarmKit' not found** con Xcode 16.4/iOS SDK 18.5. Existe una corrección posterior en ramas de desarrollo; **verificar su presencia en la rama elegida antes de cualquier nueva build**, no borrar Watch/Wake/Health ni modificar Expo/Xcode de forma oportunista.
- **Railway:** despliegue y backend editorial propios; auditoría 15/11 describió instancia treksor-admin y fuente de Articles/Thoughts, pero el estado *actual* de los despliegues y su código servido deben revisarse en su plataforma antes de afirmar producción.
- **Web:** verificar dominio, hosting, versión del HTML/JS desplegado y pipeline real. **No asumir** que GitHub/PR actualiza chatgpt.site.
- **Supabase:** respetar ownership, RLS y privacidad por consentimiento; no sincronizar mood, diario, prioridades privadas, salud, GPS o mensajes sin consentimiento y modelo seguro.
- **Apple Watch:** la existencia de un target/puente no garantiza una interfaz watchOS instalada, un dispositivo físico pareado ni sincronización fiable. Evitar duplicados y tratar permisos como opcionales.

## 4. Protocolo de cambios y continuidad permanente

**Antes de cada tarea futura:** 1) leer este archivo completo y el alcance exacto pedido; 2) actualizar inventario remoto de ramas/PR y anotar SHA; 3) obtener git status local y confirmar si hay MERGING; 4) verificar base realmente instalada/publicada y configuraciones nativas si importan; 5) revisar solo los archivos afectados y punto de recuperación; 6) ejecutar el cambio mínimo autorizado; 7) probar, documentar evidencias, riesgos y archivos concretos. **Nunca hacer merges automáticos, push --force, downgrade de componentes ni cambios colaterales.**

**Cuándo actualizar este handoff:** únicamente después de confirmar un cambio real. Anotar fecha/hora, repositorio, rama, commit SHA o PR, alcance, pruebas ejecutadas y resultado, estado del despliegue y estado instalado, decisiones aprobadas, pendientes y rollback. Distinguir siempre **decisión de producto**, **código escrito**, **mergeado**, **desplegado** y **probado**. No reescribir retrospectivamente el documento maestro original sin instrucción expresa. Mantener un historial breve de decisiones en esta misma referencia. Por defecto, documentación a rama aislada + revisión; **no alterar develop ni fusionar sin autorización**.

### Historial breve de decisiones y hechos confirmados

| Fecha | Decisión / hecho | Evidencia y condición |
| --- | --- | --- |
| Definiciones históricas | Treksor, The Architect, cuatro pilares, jerarquía Ecosystem, Today/Mentor/Progress/Community; preservar navegación, colors y funcionalidad | Documento maestro íntegro a continuación; decisiones vigentes, cambios solo por solicitud |
| 2026-11-12 a 2026-11-14 | Today útil, pilares conectados, retención y Premium, goals/comunidad/watch-ready; Home carrusel, Progress agrupado | Ramas feature y PR #6–#12; no equivalen a despliegue |
| 2026-11-13 | Auditoría de diseño y edición Admin; no liberar cambios sin verificar endpoint y categorías reales | TreksorAdmin, PR #2/#3 y TREKSOR_DESIGN_SYSTEM_AUDIT.md |
| 2026-11-14 a 2026-11-15 | Integración móvil, Quick Notes recordatorios opt-in y protección de módulos nativos | TreksorApp integración SHA bc7ce8f; PR #14 abierta |
| 2026-11-15 | Auditoría y código inicial de Today/Groceries compartidos; se verifica falta de paridad completa | TreksorApp auditoría SHA 9e5f726; PR #15 borrador abierto |
| 2026-11-15 | Se decide preservar el documento maestro completo en rama **docs/treksor-project-handoff-20261115** creada desde SHA **9e5f726df293bffbfd789a79ef8eb06783b36c05** | **Solo documentación.** Ningún merge, build, edición de app, configuración, base de datos, Railway o instalación iPhone |

---

## 5. Documento maestro original de continuidad — fuente íntegra

Las siguientes secciones son el texto original facilitado el 15/11/2026. Se preservan para que ningún chat futuro pierda decisiones de producto, reglas estrictas, filosofía y contexto. Sus referencias a despliegues/estado se deben contrastar siempre con el snapshot verificado anterior y con el estado real del día de trabajo.

---

# TREKSOR — DOCUMENTO MAESTRO DE CONTINUIDAD
**Actualizado: 15 de noviembre de 2026**

## INSTRUCCIÓN PRINCIPAL PARA EL NUEVO CHAT

Estamos continuando el desarrollo de **TREKSOR**, una plataforma premium de desarrollo personal masculino, con aplicación iPhone, sitio web, panel administrativo, backend, comunidad y funciones para Apple Watch.

Este proyecto lleva meses de desarrollo y ya tiene numerosas funcionalidades e integraciones.

**NO QUIERO RECONSTRUIR LA APLICACIÓN, EMPEZAR DE CERO NI CAMBIAR LO QUE YA FUNCIONA.**

Necesito que actúes como responsable técnico del proyecto, trabajando de forma controlada, conservadora y profesional.

Tu prioridad es proteger todo lo desarrollado, mantener la identidad visual, evitar regresiones y realizar únicamente las modificaciones que yo solicite.

### REGLAS OBLIGATORIAS

1. **No modifiques ninguna función, pantalla, color, menú o estructura que yo no haya pedido modificar.**
2. No rediseñes Treksor por iniciativa propia.
3. No reorganices el Ecosystem ni cambies la jerarquía de navegación sin mi autorización.
4. No sustituyas componentes modernos por versiones anteriores.
5. No cambies los colores, fuentes, iconos o identidad The Architect.
6. No elimines funciones para resolver errores de compilación.
7. No realices cambios masivos cuando sea suficiente modificar un archivo.
8. No publiques cambios en producción por iniciativa propia.
9. No cambies la configuración de Expo, Xcode, Apple Watch, Supabase o RevenueCat sin comprobar el impacto.
10. Antes de modificar código, verificá cuál es la rama correcta y qué versión está funcionando.
11. Conservá siempre un punto de recuperación.
12. Después de cada trabajo, comprobá que no haya regresiones y explicá qué archivos modificaste.
13. No afirmes que una funcionalidad está terminada si únicamente está preparada en código o pendiente de pruebas.
14. Si encontrás problemas fuera de la tarea solicitada, documentalos; no los corrijas sin autorización, salvo una medida mínima necesaria para evitar un daño inmediato.
15. No aproveches una tarea pequeña para realizar un rediseño general.

**Principio fundamental: mejorar lo existente sin destruir lo conseguido.**

---

# 1. QUÉ ES TREKSOR

Treksor es un ecosistema de desarrollo personal enfocado en el hombre moderno.

Su propósito es ayudar a las personas a desarrollar disciplina, salud física, claridad mental, equilibrio, propósito y relaciones humanas de calidad.

No es exclusivamente una aplicación de fitness, senderismo, meditación o productividad.

Todos sus componentes deben funcionar como un sistema coherente de crecimiento personal.

Queremos una plataforma que inspire confianza, elegancia, categoría, discreción, inteligencia y calidad.

El usuario debe sentir que está utilizando una herramienta premium que lo ayuda a organizar su vida y progresar de manera concreta.

No queremos pantallas llenas de frases motivacionales sin utilidad.

## LOS CUATRO PILARES CENTRALES

### BODY

Desarrollo físico y bienestar.

Incluye:

- Workout, rutinas, ejercicios y grupos musculares.
- Registro de entrenamientos, series, repeticiones y pesos.
- Planificación semanal.
- Nutrition, alimentación y lista de compras.
- Seguimiento de actividad y progreso físico.
- Integraciones opcionales con Apple Health y smartwatch.

**Workout y Nutrition pertenecen a Body. No deben competir con los pilares principales en el menú.**

### MIND

Desarrollo intelectual, reflexión y claridad mental.

Incluye:

- Artículos.
- Lecturas y aprendizaje.
- Diario y reflexiones privadas.
- Prácticas de pensamiento.
- Ejercicios de concentración y razonamiento.
- Herramientas que promuevan creatividad, conexiones entre ideas y diferentes formas de pensar.

Debe ser útil e intelectualmente estimulante, no una colección de frases genéricas.

### BALANCE

Equilibrio personal, recuperación y bienestar mental.

Incluye:

- Meditación.
- Respiración y relajación.
- Prácticas de equilibrio.
- Descanso, recuperación y herramientas relacionadas con sueño cuando estén implementadas.
- Seguimiento de prácticas completadas.

Debe ayudar a encontrar estabilidad sin generar presión innecesaria.

### PURPOSE

Dirección personal, objetivos y sentido.

Incluye:

- Visión personal.
- Definición de prioridades.
- Objetivos a corto y largo plazo.
- Reflexión sobre valores.
- Planificación orientada a resultados.

Purpose debe conectar las acciones cotidianas con las metas de cada usuario.

---

# 2. HERRAMIENTAS TRANSVERSALES

Los siguientes elementos complementan los cuatro pilares.

## TODAY

Today es el centro de la actividad diaria.

Su propósito es responder:

- ¿Qué quiero lograr hoy?
- ¿Qué acción concreta puedo realizar?
- ¿Cómo estoy avanzando?
- ¿Qué aprendí hoy?

Funciones desarrolladas o preparadas:

- Prioridad diaria.
- Acciones vinculadas con los pilares.
- Reflexión al finalizar el día.
- Seguimiento de acciones.
- Conexión con el progreso personal.
- Recomendaciones basadas en actividades registradas.
- Sincronización parcial de fechas de actividad.

**Importante: en la arquitectura móvil más reciente, Today tiene su propia sección. No debe volver a saturar Home.**

## MENTOR

Mentor tiene su propio espacio.

La visión es desarrollar un asistente de inteligencia artificial que funcione como guía personal.

Debe ayudar a interpretar información, aclarar objetivos, recomendar próximos pasos y conectar los pilares.

No debe inventar avances ni asumir que una persona completó actividades por haber visitado una pantalla.

La información privada solamente debe compartirse cuando corresponda y exista consentimiento.

Además, existe una dimensión de mentores humanos dentro de la comunidad. **Mentor IA y mentores humanos no son el mismo servicio** y sus interfaces deben distinguirse.

## PROGRESS

Es la sección donde se muestran resultados.

Debe incluir:

- Actividades registradas.
- Entrenamientos.
- Prioridades completadas.
- Prácticas de Balance.
- Avances de Purpose.
- Objetivos medibles.
- Resúmenes semanales.
- Recomendaciones explicables.

En la arquitectura más reciente, **Goals, Connected Journey y Weekly Review se organizan dentro de Progress**, en lugar de convertir Home en una pantalla interminable.

## COMMUNITY

La comunidad busca conectar personas reales mediante experiencias compartidas.

Incluye actividades locales, caminatas, hiking, camping, fitness, encuentros y otras experiencias.

El objetivo no es crear otra red social de likes.

Queremos relaciones humanas, actividades que aporten valor, confianza y experiencias difíciles de replicar.

La comunidad debe conservar procedimientos de privacidad, seguridad, inscripción y moderación.

## QUICK NOTES Y RECORDATORIOS

Se definió la necesidad de contar con notas y tareas rápidas.

Ejemplos:

- Enviar un correo.
- Recordar una llamada.
- Registrar una tarea pendiente.
- Programar un recordatorio.

Las notificaciones deben ser opcionales.

No deben invadir la experiencia de usuario.

La sincronización privada entre dispositivos requiere reglas específicas de consentimiento y todavía no está completamente resuelta.

---

# 3. DISEÑO VISUAL — THE ARCHITECT

**EL DISEÑO ES UNA DE LAS PARTES MÁS IMPORTANTES DEL PROYECTO.**

Se eligió una identidad visual denominada **The Architect**.

Sus características:

- Masculina.
- Minimalista.
- Elegante.
- Premium.
- Sobria.
- Atemporal.
- Discreta.
- Tecnológicamente sofisticada.
- Con jerarquías tipográficas claras.
- Sin decoración innecesaria.

## PALETA VISUAL

La aplicación usa una paleta nocturna con acentos dorados.

En `theme/architect.ts`, la rama auditada contiene estos valores:

| Elemento | Color |
|---|---|
| Fondo principal móvil | `#05080D` |
| Superficies | `#0B1017` |
| Superficies elevadas | `#121922` |
| Dorado | `#D7B877` |
| Texto principal | `#F5F4F1` |
| Texto secundario | `#C8C3BA` |
| Texto discreto | `#A5AAAF` |

También existen variantes de la misma familia visual utilizadas en la web y en otras pantallas, incluido el fondo `#02050C`.

**No reemplaces arbitrariamente unos tonos por otros.** Primero verificá los tokens de diseño correspondientes a cada plataforma.

No agregues colores vibrantes, verdes decorativos, degradados llamativos ni estilos diferentes de los ya establecidos.

Los colores de estados como éxito o error pueden utilizarse de forma limitada cuando tienen significado funcional.

### TIPOGRAFÍA

Respetar la jerarquía establecida en The Architect:

- Títulos principales.
- Títulos de sección.
- Encabezados de tarjetas.
- Texto de cuerpo.
- Etiquetas y subtítulos.

No cambiar fuentes ni tamaños globales sin una solicitud explícita.

### ICONOS DE LOS PILARES

La identidad establecida usa:

- Body: mancuerna.
- Mind: cerebro.
- Balance: hoja.
- Purpose: brújula.

Conservar el mapa de iconos centralizado.

### IMÁGENES Y CONTENIDO

Las imágenes deben transmitir calidad, masculinidad, autenticidad y propósito.

Para artículos editoriales se estableció preferencia por:

- Fotografías reales.
- Bancos de imágenes gratuitos con licencias apropiadas.
- Imágenes coherentes con los temas.
- Hombres como protagonistas.
- Evitar rostros mirando directamente a cámara.

No reemplazar automáticamente fotografías reales por imágenes generadas con IA.

---

# 4. ECOSYSTEM — NO CAMBIAR SU ESTRUCTURA

El Ecosystem de Treksor representa el sistema integrado de desarrollo personal.

**No es un concepto relacionado con ecología, reciclaje o naturaleza.**

La arquitectura debe ser coherente:

**Cuatro pilares principales: Body, Mind, Balance y Purpose.**

**Herramientas complementarias: Today, Mentor, Progress y Community.**

En Home, la versión móvil más reciente conserva un carrusel de los cuatro pilares.

Cada elemento tiene su lugar.

No crear nuevos pilares por cada funcionalidad.

No colocar Nutrition, Workout, Mentor, Today o Community al mismo nivel conceptual que los cuatro pilares.

No duplicar accesos o menús sin una razón clara.

No restaurar una pantalla Home antigua si eso elimina el carrusel y la jerarquía actuales.

**Esta organización debe permanecer intacta salvo que yo solicite expresamente cambiarla.**

---

# 5. CÓMO TRABAJAMOS TÉCNICAMENTE

Utilizamos:

**Git Bash en Windows:** para revisar y operar el repositorio local.

**GitHub:** para almacenar código, gestionar ramas, comparar cambios y mantener versiones.

**Expo / EAS:** para preparar y compilar Treksor Dev para iPhone.

**Xcode:** utilizado por el entorno de compilación iOS, normalmente mediante EAS.

**Supabase:** autenticación, base de datos y servicios compartidos.

**Railway:** servicios del panel administrativo y distribución de contenido.

**Backend:** servicios adicionales que deben verificarse antes de modificar su despliegue.

**Web:** código del sitio público y comunidad, con despliegue independiente de la app.

**RevenueCat:** estructura de compras y suscripciones.

## NUESTRA FORMA DE TRABAJAR CON GIT BASH

Yo tengo acceso a una computadora Windows con Git Bash.

El asistente debe poder guiarme proporcionando comandos concretos.

El procedimiento habitual es:

1. El asistente determina qué necesita revisar.
2. Me proporciona el comando exacto de Git Bash.
3. Yo lo copio y lo ejecuto.
4. Le comparto la salida.
5. El asistente interpreta el resultado antes de indicar el siguiente comando.
6. Solo se realizan cambios cuando está clara la rama, el objetivo y el posible impacto.

**No asumas que podés ejecutar comandos en mi computadora si no tenés acceso explícito a ella.**

Cuando uses GitHub conectado a ChatGPT, distinguí entre los cambios remotos y los archivos que están físicamente en mi PC.

Un archivo actualizado en GitHub no significa que mi carpeta de Windows se haya actualizado.

Una compilación realizada en EAS tampoco significa que se haya instalado automáticamente en mi iPhone.

## COMANDOS DE DIAGNÓSTICO HABITUALES

Estos son comandos orientativos para revisar el estado sin reemplazar código:

`pwd`

`git status`

`git branch --show-current`

`git branch -a`

`git log -1 --format="%H %cs %s"`

`git remote -v`

`git diff --stat`

`git fetch origin --prune`

`git log --oneline --decorate -15`

Utilizá rutas reales verificadas. No inventes la ubicación de mi repositorio en Windows.

Antes de indicar comandos que cambien ramas, verifiquen merges o afecten archivos, examiná la salida de `git status`.

### ADVERTENCIA: ESTADO MERGING

Un informe técnico del 15 de noviembre menciona que mi repositorio local de Windows había estado en estado **MERGING**.

Esto debe comprobarse nuevamente.

Si Git Bash muestra un merge pendiente:

- No ejecutar automáticamente `git pull`.
- No cambiar de rama por la fuerza.
- No eliminar archivos para desbloquear Git.
- No ejecutar `git reset --hard`.
- No ejecutar `git clean -fd`.
- No cancelar o completar un merge sin comprender qué cambios contiene.
- No ejecutar merges adicionales encima de un conflicto sin resolver.

Primero identificar el estado, preservar los cambios locales y definir la recuperación segura.

**Mi conexión de Treksor Dev al iPhone ya costó bastante trabajo. No quiero perderla por una operación Git precipitada.**

## CÓMO MODIFICAR CÓDIGO

Trabajar sobre la versión más reciente y compatible.

Antes de empezar:

- Identificar la rama y el commit.
- Revisar si hay cambios locales sin guardar.
- Comparar con GitHub.
- Identificar los archivos necesarios.
- Definir el cambio mínimo.

Después:

- Revisar las diferencias.
- Ejecutar pruebas correspondientes.
- Corregir errores introducidos.
- Registrar el commit.
- Mantener una vía de recuperación.

No realizar merges o pushes innecesarios.

No forzar un push sobre ramas compartidas.

No hacer cambios de base de datos si la tarea es meramente visual.

No modificar toda la app para resolver un problema localizado.

---

# 6. ESTADO DE GITHUB — MUY IMPORTANTE

Repositorio móvil:

https://github.com/treksorapp-cmd/TreksorApp

La rama predeterminada sigue siendo:

`develop`

**Pero develop no es la referencia actual para reconstruir Treksor Dev.**

La antigua base de diseño fue:

`release/treksor-1.1.0`

Posteriormente se desarrollaron estas cuatro fases:

- PR #6 — Today.
- PR #7 — Conexión entre pilares.
- PR #8 — Retención y validación Premium.
- PR #9 — Objetivos compartidos, comunidad y preparación de Apple Watch.

Estas fases quedaron integradas en una rama posterior.

## RAMA DE INTEGRACIÓN DEL 14 DE NOVIEMBRE

`integration/treksor-unified-20261114`

PR #14:

https://github.com/treksorapp-cmd/TreksorApp/pull/14

Último commit observado:

`bc7ce8ff1c00778d75814e5cd1a2f815751767fe`

Esta rama reunió las fases anteriores con desarrollos móviles más recientes.

Su arquitectura conserva:

- Home con carrusel de cuatro pilares.
- Today como sección independiente.
- Progress con Goals, Connected Journey y Weekly Review.
- Mentor y controles de sesión.
- Community integrada en su navegación.
- Investigación Premium bajo Profile.
- Diseño The Architect.
- Módulos nativos relacionados con Watch, Wake y Health.

No considerarla automáticamente una versión instalada: el PR #14 seguía abierto como borrador en la última verificación.

## RAMA MÁS RECIENTE IDENTIFICADA — 15 DE NOVIEMBRE

`audit/mobile-web-parity-20261115`

PR #15:

https://github.com/treksorapp-cmd/TreksorApp/pull/15

Último commit observado:

`9e5f726df293bffbfd789a79ef8eb06783b36c05`

Esta rama desciende de la integración del 14 de noviembre y añade trabajo de sincronización entre app y web.

Contiene cambios para:

- Today compartido entre plataformas mediante registros mínimos de fecha.
- Lista de compras dentro de Body → Nutrition.
- Sincronización de la lista de compras mediante Supabase.
- Pantallas web para Today y Groceries.
- Pruebas de compatibilidad y documentación técnica.

**Atención: esta es la rama más avanzada identificada hasta el 15 de noviembre, pero sigue siendo un PR sin fusionar.**

No asumir que su código está publicado en el sitio web o instalado en Treksor Dev.

Antes de trabajar, comprobar nuevamente si existe una rama todavía más reciente y si el otro chat dejó modificaciones adicionales.

## ENLACES DE CONTROL

- PR #14: https://github.com/treksorapp-cmd/TreksorApp/pull/14
- PR #15: https://github.com/treksorapp-cmd/TreksorApp/pull/15

Documentación importante dentro del repositorio:

`docs/WEB_MOBILE_SYNC_AUDIT_2026-11-15.md`

`docs/CROSS_DEVICE_PARITY.md`

`docs/shared-identity-and-outcomes.md`

`docs/apple-watch-integration.md`

`docs/community-and-launch-gates.md`

Leer estos archivos antes de modificar sincronización, ecosistema o arquitectura.

---

# 7. TREKSOR DEV EN MI IPHONE

Tengo una aplicación de desarrollo llamada **Treksor Dev** conectada a mi iPhone.

Debemos proteger esta configuración y conservar su funcionamiento.

En la configuración más reciente revisada:

- Nombre: `Treksor Dev`
- Bundle ID: `com.treksor.dev`
- Perfil EAS: `iphone-dev`
- Expo owner: `treksorapps-team`
- Proyecto EAS de desarrollo: `14f7500b-1aba-4cea-9c2b-ded2c67821e2`

La aplicación de producción utiliza otro identificador:

`com.treksor.prod`

No confundirlas.

## PROHIBICIONES EN TREKSOR DEV

- No eliminar la app instalada del iPhone sin autorización.
- No cambiar el bundle identifier.
- No cambiar de proyecto Expo/EAS.
- No cambiar perfiles de compilación arbitrariamente.
- No sustituir la app de desarrollo por una compilación de producción.
- No asumir que una actualización OTA permite introducir nuevos módulos nativos.
- No modificar la configuración nativa para resolver errores de JavaScript.
- No generar una nueva compilación si no es necesaria para la tarea.
- No alterar certificados, perfiles o configuración de firma sin verificar primero.

## PROBLEMA DE COMPILACIÓN IDENTIFICADO

Se proporcionó un registro Xcode correspondiente a una compilación de Treksor Dev del 14 de noviembre de 2026.

El problema encontrado fue:

`ld: framework 'AlarmKit' not found`

La compilación utilizaba Xcode 16.4 y SDK de iOS 18.5.

El proyecto incluía módulos como:

- TreksorWatch.
- TreksorWake.
- TreksorHealth.

Esto demuestra que ya existe trabajo nativo posterior a las primeras versiones, aunque no garantiza que Apple Watch funcione completamente.

Existe una corrección relacionada con AlarmKit:

PR #13:

https://github.com/treksorapp-cmd/TreksorApp/pull/13

Ese PR fue fusionado en su propia línea de desarrollo, y la integración posterior también contempla evitar el enlace problemático.

Antes de cualquier compilación nueva, revisar si la corrección está presente en la rama elegida.

Las configuraciones posteriores de EAS incluyen una imagen con Xcode 26.2 para iPhone.

No intentes solucionar este error eliminando funciones de Wake, alarmas o Apple Watch.

**Primero comprobar el entorno nativo y las correcciones existentes.**

---

# 8. WEB, APP Y SINCRONIZACIÓN

El sitio público conocido es:

https://treksor-community.oceanicman.chatgpt.site

El código de la web se identificó en:

`web/treksor-community/dist/`

Dentro del repositorio TreksorApp.

Es importante distinguir:

- Código de la web.
- Sitio web realmente publicado.
- Aplicación móvil.
- Panel administrativo.
- Supabase.
- Compilación instalada en el iPhone.

**No se sincronizan ni despliegan automáticamente por compartir repositorio.**

La auditoría del 15 de noviembre concluyó que todavía NO existe equivalencia funcional completa entre app y web.

Hay funciones parcialmente compartidas y otras que siguen siendo locales.

La identidad debe utilizar el mismo usuario de Supabase Auth:

`auth.users.id`

Entre las funcionalidades con sincronización parcial o en preparación están:

- Perfil.
- Actividad.
- Progreso.
- Today.
- Objetivos.
- Lista de compras.
- Comunidad.

Persisten limitaciones:

- Entrenamientos detallados todavía no son totalmente editables en ambas plataformas.
- Quick Notes no tiene sincronización completa.
- Los hábitos semanales requieren un modelo compartido.
- Mentor IA y mentores humanos tienen sistemas diferentes.
- La web todavía necesita comprobarse contra el sitio realmente publicado.
- Apple Watch no tiene sincronización integral verificada.

No afirmar que toda la plataforma ya está sincronizada hasta ejecutar pruebas reales con usuarios de prueba y dos dispositivos.

---

# 9. SUPABASE Y SEGURIDAD

Proyecto:

`niakfwerfqmrmhuypkpd`

Ya se prepararon estructuras para:

- Objetivos personales.
- Eventos de actividad.
- Opiniones sobre recomendaciones.
- Actividades comunitarias.
- Registro de experiencias.
- Fechas compartidas de Today.
- Lista de compras.

Existen políticas Row Level Security para restringir información por usuario.

**No volver a aplicar migraciones existentes sin comprobarlas.**

La auditoría de seguridad había identificado una advertencia pendiente:

`auth_leaked_password_protection`

Se necesita revisar la configuración de contraseñas filtradas.

También se identificó un riesgo con la columna `meeting_point` en la tabla original de eventos comunitarios: aunque existe una vista restringida que oculta ese campo, se debe verificar que la API original no exponga información sensible.

Los repositorios GitHub se encontraban públicos en las últimas comprobaciones.

Quedó pendiente convertirlos en privados, verificando antes las autorizaciones de Railway y otros servicios.

No cambiar estos permisos precipitadamente si la tarea solicitada es otra.

---

# 10. CONTENIDO Y DASHBOARD ADMINISTRATIVO

Treksor incluye un dashboard para administración de contenido.

Se definió una línea editorial coherente con la marca.

## POWER THOUGHTS

Objetivo: una publicación diaria.

Mensajes con profundidad, calidad y coherencia.

Evitar frases vacías o motivación genérica.

## ARTICLES

Objetivo editorial: dos publicaciones semanales.

Mantener estilo Treksor.

Utilizar fotografías reales apropiadas y con derechos de uso verificados.

El panel administrativo utiliza Supabase y servicios alojados en Railway.

No inventar contenidos publicados ni asumir que el calendario está operativo sin verificarlo.

No modificar el dashboard cuando se está trabajando únicamente en una función móvil, salvo necesidad técnica demostrada.

---

# 11. SUSCRIPCIONES Y NEGOCIO

Treksor todavía no tiene usuarios externos confirmados.

La estrategia de negocio es:

**Primero utilidad → luego retención → después validación del pago.**

El propósito es construir una suscripción que las personas quieran conservar.

No crear un paywall agresivo.

No bloquear el uso básico durante una prueba de valor sin haberlo definido comercialmente.

Se investigaron posibles beneficios Premium:

- Planificación personalizada.
- Mejor interpretación del progreso.
- Funciones ampliadas de Mentor.
- Experiencia integrada entre dispositivos.

Estas ideas no implican que todos los beneficios ya estén implementados.

RevenueCat existe como integración, pero las ofertas, derechos de acceso, restauración y precios deben verificarse antes del lanzamiento comercial.

No modificar suscripciones ni precios sin autorización expresa.

---

# 12. COMUNIDAD Y EXPERIENCIAS REALES

Queremos una comunidad premium basada en conexiones humanas.

No implementar directorios públicos de usuarios, mensajería abierta o geolocalización compartida sin medidas de seguridad.

El sistema debe contemplar:

- Eventos reales.
- Organizadores.
- Registro de participantes.
- Límites de capacidad.
- Cancelación.
- Opiniones posteriores.
- Privacidad.
- Moderación.
- Seguridad de los encuentros.

Una inscripción no equivale a asistencia real.

Una valoración positiva no demuestra que se haya generado una relación duradera.

No inventar comunidades activas o eventos para que el producto parezca más completo.

---

# 13. APPLE WATCH, APPLE HEALTH Y WAKE

La visión es integrar Treksor con dispositivos personales.

Posibles funciones:

- Entrenamientos.
- Progreso.
- Datos autorizados de Apple Health.
- Descanso y recuperación.
- Alarmas y rutinas matinales.
- Interacción con Today.

El trabajo nativo evolucionó después del 12 de noviembre: el registro Xcode ya muestra el target `TreksorWatch`, y existen módulos `TreksorHealth` y `TreksorWake`.

Esto no significa que todo esté terminado ni probado físicamente.

El usuario debe controlar los permisos.

No sincronizar automáticamente datos privados o sensibles.

Evitar duplicar actividades registradas en iPhone y Apple Watch.

No introducir solicitudes innecesarias de HealthKit.

No eliminar integraciones de Watch/Wake para simplificar una compilación.

---

# 14. CÓMO DEBE SER NUESTRA COMUNICACIÓN

No soy un desarrollador profesional, pero participo activamente en el diseño, las decisiones y las pruebas de Treksor.

Cuando necesites que ejecute algo en Git Bash:

- Indicame el comando exacto.
- Explicá brevemente para qué sirve.
- Evitá dar diez comandos destructivos juntos.
- Decime qué salida necesitás.
- Continuá desde el resultado real.

Si podés resolver algo directamente mediante herramientas conectadas, hacelo cuando esté dentro del alcance autorizado.

No me hagas repetir permanentemente información que ya se conoce.

No conviertas cada mejora en una discusión interminable.

Tomá decisiones de implementación razonables dentro de la tarea pedida.

Pero **no interpretes esa autonomía como permiso para rediseñar la aplicación o cambiar su arquitectura**.

Si considero que hay que rediseñar algo, te lo voy a pedir.

Cuando encuentres una oportunidad de mejora no solicitada, podés recomendarla, pero no aplicarla automáticamente.

---

# 15. PRIORIDADES PENDIENTES

La visión futura de Treksor es:

1. Mantener una app estable, coherente y con identidad premium.
2. Conseguir que Today tenga utilidad diaria.
3. Conectar los cuatro pilares y Mentor.
4. Mostrar resultados reales en Progress.
5. Completar la sincronización entre aplicación y web.
6. Ampliar la integración de Apple Watch.
7. Crear experiencias comunitarias significativas.
8. Medir retención.
9. Validar una suscripción.
10. Preparar la plataforma para usuarios, ventas y posibles inversores.

Pero **no significa que debas ejecutar todas estas tareas ahora**.

Son el contexto estratégico del proyecto.

**Debés trabajar únicamente en la actividad concreta que yo solicite en cada momento.**

---

# 16. PROCEDIMIENTO PARA EMPEZAR ESTE NUEVO CHAT

Tu primera responsabilidad es establecer correctamente el estado actual del proyecto.

Sin modificar código, verificá:

1. Estado de GitHub.
2. Rama más avanzada.
3. Estado local de Git Bash.
4. Existencia de merges pendientes.
5. Último commit utilizado para Treksor Dev.
6. Configuración Expo/EAS.
7. Estado de la instalación y conexión con mi iPhone.
8. Si los últimos PR están fusionados o siguen pendientes.
9. Si los cambios más recientes conservan The Architect y la estructura del Ecosystem.
10. Si existe algún trabajo posterior al 15 de noviembre que deba considerarse.

Usá como punto inicial de comparación:

`audit/mobile-web-parity-20261115`

Y su base:

`integration/treksor-unified-20261114`

No ignores `release/treksor-1.1.0` ni las ramas históricas, pero tampoco regreses automáticamente a ellas.

Si Git Bash sigue en estado MERGING, ayudame primero a entender y proteger ese estado.

No ejecutes un rollback ni sobrescribas los archivos locales.

No actualices Treksor Dev en mi iPhone sin comprobar primero qué versión se va a instalar.

## OBJETIVO FINAL DE ESTE TRASPASO

Quiero poder continuar trabajando en Treksor durante muchos chats sin que cada conversación provoque una versión distinta de la aplicación.

Necesito continuidad técnica y estética.

Necesito que exista una única arquitectura coherente.

Necesito que GitHub, Git Bash, Expo, Treksor Dev y la web se gestionen de forma ordenada.

Y necesito que **The Architect, el Ecosystem, sus colores, sus pilares y todo lo que ya funciona sean considerados la base estable del proyecto**.

A partir de aquí, esperá mi próxima solicitud concreta y trabajá sobre ella sin introducir modificaciones ajenas.

**TREKSOR NO SE REINICIA. TREKSOR CONTINÚA.**
