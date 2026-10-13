# Campeones — Web v1.52 + Worker V19

## Cambios

1. Partidos cerrados por límite de tiempo del torneo: resultado asignado 3–0 para el ganador (0–3 si gana el visitante), con un pequeño asterisco junto al marcador. Sin leyenda, aclaración ni texto emergente. Se identifica el cierre `abandon_by_tournamenttimeout` y el ganador oficial de BGA; los puntos de BGA no se tratan como goles en este caso.
2. Cuando todos los partidos de una jornada están terminados, desaparecen sus rectángulos verdes «Finalizado». Mientras queden partidos pendientes o en juego, se conservan.
3. La primera jornada no terminada se muestra arriba como «Jornada X - En curso». Las demás mantienen el orden numérico. Al completar la jornada, la siguiente sube al primer puesto, aunque siga pendiente de generación en BGA. El orden se recalcula al cargar los datos guardados o al actualizar manualmente.

Se conservan los nombres de v1.51, incluido Radikalgyn → Var y a casa y Rob Avi → Paketón.

## Instalación

1. En Cloudflare, sustituir el código del Worker por `worker/worker-v19-visitor-kv.js`. Mantener el binding `CAMPEONES_KV` y la configuración actual. El Worker V19 parte de V18 y conserva la reducción de escrituras KV. No necesita cookie personal.
2. En la web, sustituir `index.html`, `app.js` y `styles.css`. Mantener `assets/` (incluida también en el paquete).
3. Entrar en la web y pulsar «Actualizar datos» en cada división. Los resultados antiguos se validan una vez para detectar cierres por tiempo que estuvieran guardados como 1–0. Después vuelven a reutilizarse sin consultas de detalle a BGA. Si BGA no responde, se conserva la información guardada y se puede reintentar más tarde.

No borrar KV ni el almacenamiento local del navegador. La clave local se conserva para reutilizar los datos existentes.

## Comprobaciones

- Datos reales de la mesa 926131177: cierre por tiempo del torneo, santi21gc ganador frente a radikalgyn; conversión a 3–0 con asterisco verificada.
- Marcador normal 4–3 preservado; ganador ambiguo rechazado.
- Segunda consulta del resultado validado sin llamadas a BGA.
- Orden de jornadas antes y después de completarlas; etiquetas al terminar toda la jornada; asterisco y nombres corregidos.
- Sintaxis JavaScript comprobada en web y Worker.

Paquete preparado para instalación. No se ha desplegado desde esta conversación.
