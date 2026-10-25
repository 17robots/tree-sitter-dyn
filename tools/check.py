#!/usr/bin/env python3
"""Check local corpus/reproducibility; optionally check workspace editor provenance."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import tomllib
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--workspace', type=Path)
parser.add_argument('--provenance-only', action='store_true')
args = parser.parse_args()
grammar = Path(__file__).resolve().parents[1]
ts = os.environ.get('TS', 'tree-sitter')
subprocess.run(['python3', str(grammar/'tools/check-generator.py'), ts], check=True)
if not args.provenance_only:
    subprocess.run([ts, 'test'], cwd=grammar, check=True)
    with tempfile.TemporaryDirectory(prefix='dyn-cast-grammar-') as directory:
        source = Path(directory) / 'main.dyn'
        for expression in ('#cast(i32) 1', '#bitcast(u32) 1.0',
                           '#cast(i32,)', '#cast(i32, 1, 2)'):
            source.write_text(f'fn main() {{ value := {expression} }}\n')
            result = subprocess.run([ts, 'parse', str(source)], cwd=grammar,
                                    capture_output=True, text=True)
            assert result.returncode != 0 and ('ERROR' in result.stdout or 'MISSING' in result.stdout), (expression, result.stdout, result.stderr)
    with tempfile.TemporaryDirectory(prefix='dyn-case-grammar-') as directory:
        source = Path(directory) / 'main.dyn'
        source.write_text('fn main() { case 1 { 1 => {}, _ => {} } }\n')
        result = subprocess.run([ts, 'parse', str(source)], cwd=grammar,
                                capture_output=True, text=True)
        assert result.returncode != 0 and ('ERROR' in result.stdout or 'MISSING' in result.stdout), result.stdout
    with tempfile.TemporaryDirectory(prefix='dyn-grammar-') as directory:
        output = Path(directory)
        for name in ('grammar.js', 'tree-sitter.json'):
            shutil.copyfile(grammar/name, output/name)
        subprocess.run([ts, 'generate'], cwd=output, check=True)
        for name in ('src/parser.c', 'src/grammar.json', 'src/node-types.json'):
            assert (output/name).read_bytes() == (grammar/name).read_bytes(), f'Stale generated grammar: {name}'
if args.workspace:
    root = args.workspace.resolve()
    manifest = json.loads((root/'zed-dyn/grammars/provenance.json').read_text())
    extension = tomllib.loads((root/'zed-dyn/extension.toml').read_text())
    assert manifest['published_revision'] == extension['grammars']['dyn']['rev'], 'Extension/provenance pin mismatch'
    assert manifest['generator'] == (grammar/'.tree-sitter-version').read_text().strip(), 'Generator pin mismatch'
    for name in ('grammar.js', 'src/parser.c', 'src/scanner.c', 'src/grammar.json', 'src/node-types.json'):
        data = (grammar/name).read_bytes()
        assert data == (root/'zed-dyn/grammars/dyn'/name).read_bytes(), f'Editor grammar drift: {name}'
        assert hashlib.sha256(data).hexdigest() == manifest['local_sha256'][name], f'Grammar provenance mismatch: {name}'
print('PASS grammar contracts' + (' and workspace editor provenance' if args.workspace else ''))
