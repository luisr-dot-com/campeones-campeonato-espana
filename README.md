# Campeones — Web 2.0 integrada

## Instalación

Publicar `index.html`, `app.js`, `copa.js`, `temporadas.js`, `styles.css`, `cronicas.js` y las carpetas `cronicas/`, `temporadas/` y `assets/` en el proyecto actual de la web. No sustituir el Worker actual ni borrar KV o datos del navegador.

En futuras actualizaciones, conservar el contenido publicado de `cronicas/index.json`: no reemplazarlo por un índice vacío.

## Comportamiento

### Estructura general

- La cabecera común muestra a la izquierda «Campeones — Campeonato de España» y la división activa o la Copa, a continuación los dos selectores alineados y, en el extremo derecho, el trofeo.
- El selector Liga/Copa ocupa el mismo ancho que las pestañas Campeonato, Participantes, Reglamento e Histórico situadas inmediatamente debajo.
- Cambiar entre Liga y Copa conserva la sección abierta: por ejemplo, desde Participantes de Liga se pasa directamente a Participantes de Copa.

### Liga

- En curso: marcador enlazado a la mesa BGA.
- Finalizado sin crónica: marcador enlazado a BGA y estado «Finalizado», salvo que toda la jornada esté cerrada y se oculte esa etiqueta.
- Finalizado con crónica publicada: marcador y rectángulo «📖 Leer crónica» abren la crónica dentro de la web. «Leer crónica» permanece visible cuando acaba la jornada.
- El lector se cierra con «Cerrar» o Escape y devuelve el foco al enlace utilizado. No abandona el calendario.
- División acompañada de «- temporada 1», con temporada en minúsculas.
- Rectángulos de estado más anchos para textos como «En juego · Prórroga». En móvil ocupan una fila completa.
- Tarjetas algo más compactas (altura mínima de 60 px), conservando títulos de jornada con la misma altura mínima.
- Se conservan la cabecera con diagonal, los nombres de jugador bajo el equipo y la separación de encuentros repetidos por mesa.
- La columna «División» del directorio de participantes queda centrada.
- Los empates a puntos se resuelven mediante una miniliga conjunta entre todos los equipos implicados: puntos directos acumulados, diferencia de goles directa, diferencia de goles general y orden de BGA. Todos los enfrentamientos repetidos cuentan.
- El punto 6 fija siete días por partido, prohíbe saltar el turno y establece una derrota por 3-0 para quien tenga menos tiempo cuando el encuentro termine por tiempo.

### Copa

- Liga y Copa se integran en la misma web y conservan la misma cabecera visual.
- El cuadro completo se recorre horizontalmente desde la ronda preliminar hasta la final.
- Cada eliminatoria usa un único marcador global, contenido en un recuadro ligeramente sombreado que actúa como enlace directo a la mesa de BGA.
- Los pases directos, el estado, el porcentaje y los clasificados se muestran dentro de cada tarjeta, sin códigos internos de BGA.
- Al pulsar un equipo se abre una ventana con su recorrido y sus resultados en la Copa.
- Participantes utiliza el mismo formato visual que la Liga, sin columna de división y con las columnas Equipo, Jugador y ELO en el sorteo.
- El ELO queda fijado con la copia previa al inicio de la Copa, guardada el 1 de noviembre de 2026; no se actualiza durante el torneo. Garban figura con 143 ELO.
- Las plazas todavía sin equipo se representan mediante puntos suspensivos y los accesos del cuadro se reducen a «Rondas previas» y «Fase final».
- El Reglamento de Copa contiene cuatro apartados: participantes y formato; emparejamientos y pases directos; ida y vuelta; y clasificación para la siguiente ronda.
- La versión incorpora una instantánea local del cuadro en curso. La actualización automática desde el torneo de BGA requerirá conectar estos datos al Worker de producción.

### Temporadas

- Cada competición dispone de su propio Histórico. La temporada actual no aparece como temporada archivada.
- Si todavía no hay temporadas cerradas, la página muestra un mensaje específico para Liga o Copa y oculta el selector.
- La estructura admite temporadas archivadas mediante `temporadas/index.json` y archivos `temporadas/temporada-X.json`.
- Una temporada archivada conserva nombres históricos, participantes, resultados, clasificación final, cuadro de Copa, pases directos, clasificados y campeón.
- Una temporada archivada no contiene enlaces a BGA. En Liga, el resultado abre la crónica si existe; si no existe, queda como texto. En Copa, los resultados archivados quedan como texto mientras no haya crónicas de Copa.
- El contrato previsto es guardar cada cierre en Cloudflare KV y exportar además una copia `temporada-X.json`. Esta entrega prepara el lector y el esquema; no inventa temporadas anteriores ni modifica el KV actual.

## Cómo se incorporan las crónicas

La web consulta `cronicas/index.json` al entrar, al pulsar «Actualizar datos» y al volver a la pestaña (máximo una consulta por minuto en este último caso). Solo consulta el índice publicado, no ejecuta IA ni hace consultas adicionales a BGA. Un fallo del índice no bloquea los resultados.

**El paquete incluye un índice vacío: no contiene crónicas reales ni activa el generador automático.** La generación y revisión que estáis desarrollando en Codex continúa por separado. Para mostrar una crónica real hay que añadir su texto revisado al índice y publicarlo junto a la web.

### Añadir una crónica revisada

Se incluye `scripts/publicar_cronica.py` (Python 3, sin dependencias). Recibe un texto UTF-8 con párrafos separados por una línea en blanco. No genera ni revisa el contenido, no descarga datos y no publica en Cloudflare; prepara el índice local.

Ejemplo (sustituir por los datos acreditados del partido):

```text
python scripts/publicar_cronica.py --table-id NUMERO_MESA --division NUMERO_DIVISION --jornada NUMERO_JORNADA --titulo "Título de la crónica" --archivo "cronica_revisada.txt"
```

Después publicar `cronicas/index.json` en el mismo proyecto de la web. Para sustituir una crónica existente, añadir `--reemplazar`.

Si el despliegue se hace mediante ZIP/carpeta, incluir la web completa y el índice actualizado: publicar solo la carpeta de crónicas como una nueva web podría eliminar el resto de archivos de ese despliegue.

### Contrato para conectar el publicador automático

El publicador puede producir el mismo JSON, sin depender del script anterior:

```json
{
  "schemaVersion": 1,
  "chronicles": [
    {
      "tableId": "NUMERO_MESA",
      "season": 1,
      "division": 1,
      "round": 1,
      "status": "published",
      "title": "Título revisado",
      "paragraphs": ["Primer párrafo revisado", "Segundo párrafo revisado"]
    }
  ]
}
```

`NUMERO_MESA` debe sustituirse por un identificador numérico real. La entrada ilustrativa no se carga en el paquete.

La relación se hace por `tableId` y temporada, no por la pareja de rivales. División y jornada, cuando se incluyen, también deben coincidir. Entradas de otra temporada, borradores, contenido vacío y mesas duplicadas no se muestran como crónicas disponibles. Solo debe marcarse `published` después de la validación del proceso editorial.

Si el publicador sirve ese contrato desde un Worker, se puede definir `window.CAMPEONES_CRONICAS_URL` antes de cargar `cronicas.js`; el endpoint debe permitir lectura pública y CORS desde la web. No se ha creado, supuesto ni modificado ningún endpoint de producción en esta entrega. El contrato del publicador real debe conectarse cuando esté disponible.

## Alcance de la entrega

Paquete preparado y comprobado localmente. Todos los recursos visuales y tipografías se sirven desde `assets/`; solo permanecen externos el Worker de datos y los enlaces funcionales a BGA. No desplegado ni probado contra crónicas reales de producción. Ver `VALIDACION.txt` para el detalle de las comprobaciones.
