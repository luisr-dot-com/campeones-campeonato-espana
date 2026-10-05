# Campeones: Oliver y Benji - Campeonato de Espana - V27

Version final del sitio del Campeonato de Espana de **Campeones: Oliver y Benji - El juego de cartas**, conectado a Board Game Arena (BGA) mediante un Cloudflare Worker.

## Estado de esta version

V27 cierra los dos problemas que quedaban pendientes:

1. **Asignacion jugador -> Nankatsu/Toho en partidos en curso**: se lee directamente del estado interno que BGA incorpora en el HTML de la partida (`gameui.gamedatas.players[].team`). Ya no se infiere por cartas, orden visual, `table_order`, `active_player` ni por quien empieza atacando.
2. **Marcador de partidos finalizados**: se obtiene directamente de `tableinfos.html`, usando `player[].score`. Por tanto, una partida terminada ya no depende de recuperar el `gameserver` historico ni de reconstruir goles desde el archivo.

Tambien se mantienen los enlaces visibles desde cada marcador del calendario a la mesa correspondiente de BGA.

## Versiones

- Web: **V27**
- Worker: **V10**
- Cloudflare Pages: `https://campeones-campeonato-espana.pages.dev`
- Cloudflare Worker: `https://campeones-bga-api.luis-rosaperez.workers.dev/`

## Estructura

```text
campeones-campeonato-espana-final-v27/
|- README.md
|- website/
|  |- index.html
|  |- app.js
|  |- styles.css
|  `- assets/
|     |- ed-warner-full.png
|     |- trofeo-recortado.png
|     `- trofeo-liga.jpeg
`- worker/
   `- worker-v10.js
```

## Logica de datos BGA

### 1. Torneos y jornadas

La web consulta al Worker, que a su vez usa el `getOverview` del torneo de BGA. De ahi se obtienen:

- participantes;
- jornadas/steps;
- mesas (`tableId`);
- estado del partido;
- resultado oficial del torneo para ganador/derrota cuando corresponde.

IDs de torneo:

- 1a Division: `608407`
- 2a Division: `608411`
- 3a Division: `608412`
- 4a Division: `608414`
- 5a Division: `608415`
- 6a Division: `608416`

### 2. Partidos en curso

Para una mesa viva, el Worker:

1. obtiene `tableinfos.html` para localizar el `gameserver` actual;
2. lee el HTML de la partida;
3. extrae de `gameui.gamedatas.players` el campo autoritativo `team` de cada jugador (`Nankatsu` o `Toho`);
4. lee el historial de notificaciones para reconstruir el marcador y la fase;
5. asigna el marcador de Nankatsu/Toho al jugador correcto usando el `team` real de BGA.

No se usan ya heuristicas basadas en cartas jugadas.

### 3. Partidos finalizados

Para una mesa terminada, el Worker consulta primero:

`https://boardgamearena.com/table/table/tableinfos.html?id=TABLE_ID`

Si la mesa esta finalizada, BGA devuelve para cada jugador:

- `player_id`
- `name`
- `finish_game: "1"`
- `score`

V27 devuelve esos `score` directamente a la web. Esto evita el problema de las mesas archivadas para las que BGA ya no permite detectar automaticamente el `gameserver` antiguo.

Ejemplo validado:

- mesa `926139967`
- mitxelino: `score = 2`
- Belce84_: `score = 1`
- la web debe mostrar: **Esteagua de Solares 2 - 1 Me Falla el Corazon**.

### 4. Enlaces a BGA

Cada marcador con `tableId` es un enlace visible a:

`https://boardgamearena.com/tableview?table=TABLE_ID`

Se abre en una pestana nueva.

## Cache

La cache de partidos del navegador usa la clave V27:

`campeones-bga-match-v27-<tableId>`

Esto evita reutilizar resultados guardados por versiones anteriores. Ademas, `index.html` carga:

- `styles.css?v=27`
- `app.js?v=27`

para forzar la actualizacion de los archivos estaticos tras el despliegue.

## Despliegue

### Cloudflare Worker

Sustituir el codigo actual por:

`worker/worker-v10.js`

Conservar los secretos existentes. El importante es:

- `BGA_COOKIE`

No copiar la cookie al frontend ni al repositorio.

El Worker extrae `TournoiEnLigneidt` desde `BGA_COOKIE` y lo utiliza como `X-Request-Token` en las peticiones necesarias a BGA.

### GitHub / Cloudflare Pages

Sustituir:

- `website/index.html`
- `website/app.js`
- `website/styles.css`

Los archivos de `website/assets/` no han cambiado respecto a V26, pero se incluyen en el backup completo.

## Pruebas recomendadas despues de desplegar

### Partido en curso

Mesa `926132867`:

- pmp = Toho
- Turrutu = Nankatsu
- si el marcador BGA es Nankatsu 2 - Toho 1, la web debe mostrar **REAL SOCIEDAD 1 - 2 Tarupidos**.

### Partido finalizado

Abrir:

`https://campeones-bga-api.luis-rosaperez.workers.dev/?match=926139967&archived=1`

Debe devolver directamente los jugadores con sus marcadores finales, con una respuesta equivalente a:

```json
{
  "tableId": 926139967,
  "source": "tableinfos-final",
  "phase": "Finalizado",
  "players": [
    {"id": 94005507, "name": "mitxelino", "score": 2},
    {"id": 98419995, "name": "Belce84_", "score": 1}
  ]
}
```

Despues, en la web, 3a Division debe mostrar:

**Esteagua de Solares 2 - 1 Me Falla el Corazon**

### Enlace de marcador

Pulsar sobre cualquier marcador del calendario. Debe abrir la mesa correcta de BGA en otra pestana.

## Funcionamiento de la clasificacion

La clasificacion incluye provisionalmente los partidos en curso. Los equipos que estan jugando muestran la etiqueta `EN JUEGO`.

Puntuacion:

- victoria: 3 puntos
- empate: 1 punto
- derrota: 0 puntos

Desempates configurados para la competicion:

1. enfrentamiento directo;
2. diferencia general de goles;
3. criterio BGA basado en ELO de rivales vencidos, cuando sea necesario.

## ELO

El ELO mostrado en Participantes es el ELO real de Campeones en BGA, no el `rank` general del perfil. El Worker mantiene cache para evitar consultas excesivas.

## Notas operativas

- Si BGA deja de responder con datos, comprobar primero que `BGA_COOKIE` no haya caducado.
- No exponer `BGA_COOKIE` ni `TournoiEnLigneidt` en `app.js`, GitHub o Cloudflare Pages.
- El Worker detecta dinamicamente el `gameserver` en partidas vivas; no se debe fijar manualmente `/6/`, `/14/`, `/15/`, etc.
- En partidas finalizadas V27 no necesita `gameserver`: usa `tableinfos.player[].score`.
- Las jornadas futuras no se inventan. Si BGA aun no las ha generado, la web muestra `Pendiente de generacion en BGA`.

## Resumen de la correccion V27

La arquitectura final queda asi:

- **Torneo** -> `getOverview`
- **Partido vivo** -> `tableinfos` + HTML de partida (`players[].team`) + historial
- **Partido finalizado** -> `tableinfos.player[].score`
- **Frontend** -> clasificacion, calendario, participantes y reglamento

Con esto se eliminan las inferencias que habian provocado marcadores incorrectos y se usa, siempre que BGA lo proporciona, el dato directo y autoritativo de la plataforma.
