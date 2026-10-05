# Campeones · Campeonato de España · V17

Cambios principales:
- Las seis divisiones quedan conectadas a sus torneos BGA:
  - 1ª: 608407
  - 2ª: 608411
  - 3ª: 608412
  - 4ª: 608414
  - 5ª: 608415
  - 6ª: 608409
- El roster de cada división se sincroniza con los jugadores reales del torneo BGA.
- Participantes muestra EQUIPO · JUGADOR · ELO · DIVISIÓN y se ordena por ELO descendente conforme se cargan los seis torneos.
- La clasificación incorpora temporalmente los marcadores de partidos en curso y marca esos equipos con “En juego”.
- Botón “Actualizar datos” compacto junto a las pestañas de división, con hora de última actualización debajo.
- Nombres de equipo alineados a la izquierda.
- 4ª división: imagen desplazada a la izquierda.
- 5ª división: nuevo fondo de guardameta de cuerpo entero en assets/ed-warner-full.png.
- Jornadas futuras: “Pendiente de generación en BGA” hasta que BGA cree cada paso.

El Worker V3 no necesita cambios.


V18: corregido torneo 6ª a 608416 y parser de jugadores/emparejamientos BGA robusto para arrays u objetos indexados por player_id.
