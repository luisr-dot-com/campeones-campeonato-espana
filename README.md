# Campeones — Web 2.0.4

Web estática del Campeonato de España de Campeones, con Liga, Copa, participantes, reglamento, histórico y crónicas.

## Publicación

Publicar el contenido de este ZIP en la raíz del proyecto Cloudflare Pages, manteniendo la estructura de carpetas. `index.html` es la entrada. No modificar Workers, KV ni los datos de producción.

## Archivos necesarios

- `index.html`: página principal.
- `styles.css`: estilos.
- `app.js`, `copa.js`, `temporadas.js`, `cronicas.js`: lógica de la web.
- `assets/`: imágenes y recursos gráficos utilizados. Las fuentes Inter y Bebas Neue se cargan mediante Google Fonts.
- `temporadas/index.json`: índice de temporadas archivadas.
- `cronicas/index.json`: índice de crónicas; conservar los datos ya publicados si difieren del ZIP.

## Datos

Liga y Copa consultan el Worker de producción existente. Los marcadores oficiales de Copa finalizada proceden de `tableinfos-final`; el clasificado en los empates se obtiene de datos explícitos del torneo o de su presencia acreditada en la ronda siguiente; `sportsState` solo informa de ida/vuelta, periodo y prórroga. Los datos de Copa se conservan localmente en el navegador; el botón «Actualizar datos» consulta el estado actual.

Consultar `HISTORIAL_Y_NOTAS.txt` para el registro unificado de revisiones.
