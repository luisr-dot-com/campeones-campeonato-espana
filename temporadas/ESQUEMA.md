# Histórico de temporadas

La temporada en curso se obtiene de los datos vivos de BGA. Al cerrarla, se guardará en Cloudflare KV y se exportará una copia de respaldo con el nombre `temporada-X.json`.

Cada archivo archivado debe conservar:

- `season`: número de temporada.
- `league.divisions`: participantes, nombres históricos, clasificación final y jornadas de cada división.
- `cup.rounds`: cuadro completo, pases directos, marcadores agregados, clasificados y campeón.
- `chronicleId`: identificador opcional de la crónica de un partido de Liga.

Los nombres guardados son históricos e inmutables. Una temporada archivada no contiene enlaces a BGA. Si un partido de Liga tiene crónica, su marcador abre la crónica; de lo contrario se muestra como texto. Mientras no existan crónicas de Copa, sus marcadores archivados se muestran sin enlace.
