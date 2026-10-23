# Campeones — Web v1.61

## Instalación

Publicar `index.html`, `app.js`, `styles.css`, `cronicas.js` y la carpeta `cronicas/` en el proyecto actual de la web. `assets/` se incluye para una publicación completa, pero no ha cambiado. No sustituir el Worker actual ni borrar KV o datos del navegador.

En futuras actualizaciones, conservar el contenido publicado de `cronicas/index.json`: no reemplazarlo por un índice vacío.

## Comportamiento

- En curso: marcador enlazado a la mesa BGA.
- Finalizado sin crónica: marcador enlazado a BGA y estado «Finalizado», salvo que toda la jornada esté cerrada y se oculte esa etiqueta.
- Finalizado con crónica publicada: marcador y rectángulo «📖 Leer crónica» abren la crónica dentro de la web. «Leer crónica» permanece visible cuando acaba la jornada.
- El lector se cierra con «Cerrar» o Escape y devuelve el foco al enlace utilizado. No abandona el calendario.
- División acompañada de «- temporada 1», con temporada en minúsculas.
- Rectángulos de estado más anchos para textos como «En juego · Prórroga». En móvil ocupan una fila completa.
- Tarjetas algo más compactas (altura mínima de 60 px), conservando títulos de jornada con la misma altura mínima.
- Se conservan la cabecera con diagonal, los nombres de jugador bajo el equipo y la separación de encuentros repetidos por mesa.
- La columna «División» del directorio de participantes queda centrada.
- Los empates a puntos se resuelven por puntos directos acumulados, diferencia de goles directa, diferencia de goles general y orden de BGA. Todos los partidos repetidos entre los equipos implicados cuentan en los cálculos directos.
- El punto 6 fija siete días por partido, prohíbe saltar el turno y establece una derrota por 3-0 para quien tenga menos tiempo cuando el encuentro termine por tiempo.

El histórico de temporadas no está incluido. Para su futura implementación se conserva la regla acordada: temporada archivada sin indicación «Leer crónica» y sin enlaces BGA; resultado hacia la crónica si existe, o sin enlace si no existe.

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

Paquete preparado y comprobado localmente. No desplegado ni probado contra crónicas reales de producción. Ver `VALIDACION.txt` para el detalle de las comprobaciones.
