"""Inspect actual PDF downloads/outputs; requires pypdf and an evidence directory."""
import re
import sys
from pathlib import Path
from pypdf import PdfReader

root = Path(sys.argv[1])
for filename, expected in [('ui-routes-76.pdf', 1064), ('routes-fixed.pdf', 16), ('routes-long-60.pdf', 120)]:
    reader = PdfReader(root / filename)
    text = '\n'.join(page.extract_text() for page in reader.pages)
    count = text.count('Rodada ')
    assert count == expected, (filename, count)
    assert all(float(page.mediabox.width) > 590 and float(page.mediabox.height) > 840 for page in reader.pages)
    print(f'PASS PDF {filename}: {len(reader.pages)} paginas A4; {count}/{expected} entradas de rodada; texto extraivel')
    if filename == 'ui-routes-76.pdf':
        codes = re.findall(r'\| GC-(\d+)\n', text)
        assert sorted(map(int, codes)) == list(range(1, 77))
        blocks = re.split(r'\| GC-\d+\n', text)[1:]
        for block in blocks:
            # Every complete participant block retains the ordered journey.
            rounds = re.findall(r'Rodada (\d+) -', block)
            assert list(map(int, rounds)) == list(range(1, 15)), rounds
        print('PASS PDF 76/76 pessoas cadastradas / cada pessoa com rodadas1..14 em ordem')
    if filename == 'routes-long-60.pdf':
        assert 'Continua' in text
        print('PASS PDF longo: continuacao identificada / nenhuma rodada perdida')
