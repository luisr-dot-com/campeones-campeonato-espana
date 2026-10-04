# Campeones: Oliver y Benji — Campeonato de España · V15

Actualización sobre V14:
- 2ª División conectada al torneo BGA `608411`.
- Jornada 1 (y siguientes cuando existan) usa exclusivamente los emparejamientos reales de cada `Paso` de BGA.
- Jornadas futuras todavía no generadas muestran `Pendiente de generación en BGA`; no se inventan enfrentamientos.
- Marcador y fase (`1ª Parte`, `2ª Parte`, `Prórroga`) se consultan a través del Worker.
- La clasificación incorpora una columna ELO con el ELO específico de Campeones devuelto por el Worker.
- Los resultados solo computan en la clasificación cuando el partido figura finalizado y existe marcador.
- Desempates: particular, diferencia general y, si ambos ya han jugado y persiste el empate, orden de desempate devuelto por BGA.
- Nombres de equipo actualizados según la lista comunicada el 01/10/2026.
- Participantes conserva el encabezado visible `EQUIPO | JUGADOR | DIVISIÓN`.

La web no contiene cookies ni secretos de BGA. La autenticación permanece exclusivamente en Cloudflare Worker (`BGA_COOKIE`).
El Worker V3 detecta dinámicamente el `gameServer` de cada mesa, por lo que la web no depende de una versión fija como `/14/`.
