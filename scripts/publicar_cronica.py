#!/usr/bin/env python3
"""Añade una crónica ya revisada al índice estático de la web; no despliega."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import tempfile
import os


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--table-id', required=True)
    parser.add_argument('--titulo', required=True)
    parser.add_argument('--archivo', required=True, type=Path, help='Texto UTF-8 con párrafos separados por una línea en blanco')
    parser.add_argument('--division', required=True, type=int)
    parser.add_argument('--jornada', required=True, type=int)
    parser.add_argument('--indice', type=Path, default=Path(__file__).resolve().parents[1] / 'cronicas' / 'index.json')
    parser.add_argument('--reemplazar', action='store_true', help='Sustituir una crónica de la misma mesa que ya esté en el índice')
    args = parser.parse_args()
    if not re.fullmatch(r'[0-9]+', args.table_id):
        parser.error('table-id debe ser el número de mesa BGA')
    if args.division < 1 or args.jornada < 1 or not args.titulo.strip():
        parser.error('División, jornada y título deben ser válidos')
    raw = args.archivo.read_bytes()
    text = raw.decode('utf-8-sig').strip()
    paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
    if not paragraphs:
        parser.error('La crónica está vacía')
    index = json.loads(args.indice.read_text(encoding='utf-8')) if args.indice.exists() else {'schemaVersion': 1, 'chronicles': []}
    if index.get('schemaVersion') != 1 or not isinstance(index.get('chronicles'), list):
        parser.error('Índice incompatible; no se ha modificado')
    existing = [entry for entry in index['chronicles'] if str(entry.get('tableId')) == args.table_id and entry.get('season') == 1]
    if existing and not args.reemplazar:
        parser.error('Ya existe una crónica para esta mesa; usa --reemplazar si deseas sustituirla')
    entry = {
        'tableId': args.table_id, 'season': 1, 'division': args.division, 'round': args.jornada,
        'status': 'published', 'title': args.titulo.strip(), 'paragraphs': paragraphs,
        'publishedAt': datetime.now(timezone.utc).isoformat(),
        'sourceSha256': hashlib.sha256(raw).hexdigest()
    }
    index['chronicles'] = [entry for entry in index['chronicles'] if not (str(entry.get('tableId')) == args.table_id and entry.get('season') == 1)] + [entry]
    args.indice.parent.mkdir(parents=True, exist_ok=True)
    file_descriptor, temp = tempfile.mkstemp(dir=args.indice.parent, prefix='.cronicas-', suffix='.tmp')
    try:
        with os.fdopen(file_descriptor, 'w', encoding='utf-8') as out:
            json.dump(index, out, ensure_ascii=False, indent=2)
            out.write('\n')
        os.replace(temp, args.indice)
    finally:
        Path(temp).unlink(missing_ok=True)
    print(f'Crónica {args.table_id} añadida. Publica {args.indice} junto con la web para hacerla visible.')


if __name__ == '__main__':
    main()
