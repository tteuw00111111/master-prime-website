#!/usr/bin/env python3
"""Import identification data only, deterministically; no AI processing of catalog content.

Reads the Open Icecat index with a server-side token and publishes lightweight
per-brand JSON. Run manually, never during the website build. No user submissions
are collected. Partial/failed imports never overwrite the current catalog.
"""

import argparse
from collections import Counter
from datetime import datetime, timezone
import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile
import time
import unicodedata
import urllib.error
from urllib.parse import urlparse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
LICENSE_URL = 'https://iceclog.com/open-content-license/'
REFERENCES = 'https://data.icecat.biz/export/freexml/refs/'
INDEX = 'https://data.icecat.biz/export/freexml/BR/files.index.xml.gz'
# Exclude test accounts, refurbishers and obviously miscategorized brands. This
# is an identification dictionary, never a commercial supported-brand list.
MANUFACTURERS = {
    'acer', 'alienware', 'asus', 'benq', 'bluechip', 'canon', 'cyberpower', 'deep-gaming',
    'dell', 'dell-wyse', 'epson', 'erazer', 'fujitsu', 'gigabyte', 'grundig', 'haier',
    'hannspree', 'hercules', 'honor', 'hp', 'iiyama', 'lenovo', 'lg', 'medion', 'msi',
    'nec', 'nilox', 'peaq', 'philips', 'samsung', 'tcl', 'terra', 'toshiba', 'viewsonic',
    'xpg', 'zoostorm', 'apple', 'positivo', 'avell', 'vaio', 'multilaser', 'philco',
    'microsoft', 'razer', 'huawei', 'sony', 'cce',
}


def normalized(value):
    text = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '', text)


def slug(value):
    text = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode().lower()
    value = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return {'hewlett-packard': 'hp', 'dynabook': 'toshiba', 'multi': 'multilaser'}.get(value, value)


def read_settings():
    values = {}
    path = ROOT / '.env.icecat.local'
    if path.exists():
        for line in path.read_text().splitlines():
            if '=' in line and not line.lstrip().startswith('#'):
                key, value = line.split('=', 1)
                values[key.strip()] = value.strip().strip('\"\'')
    values.update({key: value for key, value in os.environ.items() if key.startswith('ICECAT_')})
    if not values.get('ICECAT_API_TOKEN'):
        raise ValueError('Preencha ICECAT_API_TOKEN em .env.icecat.local; não use prefixo VITE_.')
    return values


def download(url, token):
    # Only this first-party host receives the secret; never include it in URLs or logs.
    if urlparse(url).hostname != 'data.icecat.biz':
        raise ValueError('Host de catálogo não permitido')
    request = urllib.request.Request(url, headers={'api-token': token, 'User-Agent': 'MasterPrimeCatalogImporter/1.0'})
    return urllib.request.urlopen(request, timeout=60)


def cached_download(url, token, filename):
    cache = ROOT / '.cache' / 'icecat'
    cache.mkdir(parents=True, exist_ok=True)
    target = cache / filename
    if target.exists() and time.time() - target.stat().st_mtime < 86400:
        return target.open('rb')
    temporary = cache / (filename + '.pending')
    with download(url, token) as response, temporary.open('wb') as output:
        shutil.copyfileobj(response, output, length=1024 * 1024)
    temporary.replace(target)
    return target.open('rb')


def license_text():
    # Verified against the publisher on 2026-10-15. Pin the license alongside the
    # importer: a third-party blog/CDN error must not destroy a completed import.
    text = (ROOT / 'scripts' / 'licenses' / 'icecat-1.4.txt').read_text()
    if 'Version 1.4' not in text or 'Terms and Conditions for Copying' not in text:
        raise ValueError('Cópia da licença não confirmada. Catálogo anterior mantido.')
    return text.strip()


def index_records(stream):
    # Detach each finished file from its parent. Clearing its attributes alone
    # leaves millions of empty nodes attached to the index tree.
    stack = []
    for event, element in ET.iterparse(stream, events=('start', 'end')):
        if event == 'start':
            stack.append(element)
            continue
        if element.tag == 'file':
            attrs = dict(element.attrib)
            if len(stack) > 1:
                stack[-2].remove(element)
            element.clear()
            yield attrs
        stack.pop()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--index', type=Path, help='Optional locally downloaded Icecat .xml.gz index')
    args = parser.parse_args()
    settings = read_settings()
    token = settings['ICECAT_API_TOKEN']
    original_license = license_text()
    print('Lendo referências do Open Icecat…', flush=True)
    with cached_download(REFERENCES + 'SuppliersList.xml.gz', token, 'suppliers.xml.gz') as response:
        suppliers = {item.attrib['ID']: item.attrib['Name'] for item in ET.fromstring(gzip.decompress(response.read())).iter('Supplier')}
    with cached_download(REFERENCES + 'CategoriesList.xml.gz', token, 'categories.xml.gz') as response:
        category_root = ET.fromstring(gzip.decompress(response.read()))
    notebook_categories = {category.attrib['ID'] for category in category_root.iter('Category')
                           if any(name.attrib.get('langid') == '1' and name.attrib.get('Value', '').lower() == 'laptops'
                                  for name in category.iter('Name'))}
    if not notebook_categories:
        raise ValueError('Categoria de notebooks não confirmada; importação interrompida.')

    # Raw names/part codes remain in the aliases; only normalize presentation/search.
    models = {}
    brand_names = {}
    seen = 0
    kept = 0
    skipped = Counter()
    print('Filtrando notebooks no índice BR (pode levar alguns minutos)…', flush=True)
    stream = args.index.open('rb') if args.index else cached_download(INDEX, token, 'BR-files.index.xml.gz')
    with stream, gzip.GzipFile(fileobj=stream) as xml:
        for attrs in index_records(xml):
            seen += 1
            if seen % 500000 == 0:
                print(f'Índice: {seen:,} registros processados; {len(models):,} nomes de notebook.', flush=True)
            if attrs.get('Catid') not in notebook_categories:
                continue
            if attrs.get('Limited', 'no').lower() not in ('', '0', 'no', 'false'):
                skipped['restricted'] += 1
                continue
            name = re.sub(r'\s+', ' ', attrs.get('Model_Name', '')).strip()
            code = attrs.get('Prod_ID', '').strip()
            brand = suppliers.get(attrs.get('Supplier_id'))
            if not name or not brand:
                skipped['missing_name_or_brand'] += 1
                continue
            brand_id = slug(brand)
            if brand_id not in MANUFACTURERS or re.search(r'\b(?:test|dummy|placeholder|autotest|do not use|impressora|printer|toner|cartridge|cartucho|scanner)\b', name, re.I):
                skipped['non_manufacturer_or_test_record'] += 1
                continue
            brand_names.setdefault(brand_id, brand)
            # Remove a repeated leading manufacturer name, but do not guess families.
            display = re.sub(r'^' + re.escape(brand) + r'\s+', '', name, flags=re.I).strip()
            if len(display) > 120 and code:
                display = code
            key = (brand_id, normalized(display))
            if key not in models:
                digest = hashlib.sha256((brand_id + ':' + normalized(display)).encode()).hexdigest()[:16]
                models[key] = {'id': digest, 'brandId': brand_id, 'name': display, 'aliases': [], 'source': 'https://data.icecat.biz/' + attrs.get('path', '')}
            record = models[key]
            for alias in (code, name):
                if alias and alias != record['name'] and alias not in record['aliases']:
                    record['aliases'].append(alias)
            kept += 1
    if not models:
        raise ValueError('Nenhum notebook importado. Catálogo anterior mantido.')

    print('Preservando licença e publicando arquivos por marca…', flush=True)
    now = datetime.now(timezone.utc).isoformat()
    base = {'version': 1, 'updatedAt': now, 'source': 'Open Icecat', 'license': '/catalog/icecat-license.txt'}
    catalog_dir = ROOT / 'public' / 'catalog'
    catalog_dir.mkdir(parents=True, exist_ok=True)
    # Files have content hashes. Publish the small manifest last, so active clients
    # never see a manifest referencing partial/new files during a failed import.
    brands = []
    with tempfile.TemporaryDirectory(prefix='master-prime-catalog-') as temporary:
        staging = Path(temporary)
        for brand_id, brand_name in sorted(brand_names.items()):
            brand_models = sorted([m for m in models.values() if m['brandId'] == brand_id], key=lambda m: m['name'].lower())
            if not brand_models:
                continue
            payload = json.dumps({**base, 'models': brand_models}, ensure_ascii=False, separators=(',', ':'))
            digest = hashlib.sha256(payload.encode()).hexdigest()[:12]
            filename = f'{brand_id}-{digest}.json'
            (staging / filename).write_text(payload + '\n')
            (staging / (filename + '.gz')).write_bytes(gzip.compress((payload + '\n').encode(), compresslevel=6, mtime=0))
            brands.append({'id': brand_id, 'name': brand_name, 'file': f'/catalog/notebooks/{filename}',
                           'compressedFile': f'/catalog/notebooks/{filename}.gz', 'count': len(brand_models)})
        target = catalog_dir / 'notebooks'
        target.mkdir(exist_ok=True)
        for path in staging.iterdir():
            shutil.copy2(path, target / path.name)
        notice = (f'Open Icecat — Notebook identification catalog\nDatabase Right data-sheet {datetime.now().year} Icecat. All rights reserved.\n'
                  f'Source: {INDEX}\nLicense: {LICENSE_URL}\n\n'
                  f'Modifications by Master Prime on {now}: filter to laptop category; exclude restricted records; '
                  'retain only identifiers, manufacturer and model names; normalize whitespace and repeated manufacturer prefix; '
                  'group identical normalized names and retain original names/part codes as search aliases; split by manufacturer. '
                  'No generated product names, technical specifications, images or commercial repair claims.\n\n'
                  'The catalog data is made available under the original Open Icecat Content License below, without charge. '
                  'Independent website code is not part of this catalog dataset.\n\n' + original_license + '\n')
        (catalog_dir / 'icecat-license.txt').write_text(notice)
        manifest = {**base, 'brands': brands, 'models': []}
        temporary_manifest = catalog_dir / 'notebooks.pending.json'
        temporary_manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
        temporary_manifest.replace(catalog_dir / 'notebooks.json')
        current_files = {Path(brand[key]).name for brand in brands for key in ('file', 'compressedFile')}
        for previous in target.iterdir():
            if previous.is_file() and previous.name not in current_files:
                previous.unlink()
    report = {'updatedAt': now, 'index': INDEX, 'categories': sorted(notebook_categories), 'indexRows': seen,
              'notebookRows': kept, 'uniqueModelNames': len(models), 'brands': len(brands), 'skipped': dict(skipped),
              'modelsPerBrand': {b['name']: b['count'] for b in brands},
              'limitations': ['BR is a language index, not proof of sale in Brazil.', 'Names may represent families or configurations; not all are a distinct chassis.', 'Open Icecat coverage is partial; unlisted models can be typed in the form.']}
    (catalog_dir / 'coverage.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'indexRows': seen, 'notebookRows': kept, 'uniqueModelNames': len(models), 'brands': len(brands)}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    try:
        main()
    except urllib.error.HTTPError as error:
        print(f'Falha HTTP {error.code} na importação. Catálogo anterior mantido; credenciais não exibidas.', file=sys.stderr)
        sys.exit(1)
    except Exception as error:
        # No URLs/headers or exception repr: an upstream error may contain secrets.
        print(f'Importação interrompida ({type(error).__name__}); catálogo anterior mantido.', file=sys.stderr)
        sys.exit(1)
