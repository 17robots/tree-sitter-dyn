#!/usr/bin/env python3
"""Release gate: the extension's pinned upstream grammar must match local files.
Reads immutable raw files only; does not publish or change the pin.
"""
import argparse
import os
import hashlib
import json
from pathlib import Path
import tomllib
import urllib.request
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--extension', type=Path, default=ROOT.parent/'zed-dyn/extension.toml', help='Extension manifest containing the immutable grammar pin')
parser.add_argument('--output', type=Path, default=Path(os.environ.get('BUILD', ROOT/'build'))/'readiness/published-grammar.json')
args=parser.parse_args()
if not args.extension.is_file(): parser.error('Extension manifest not found; pass --extension PATH')
settings=tomllib.loads(args.extension.read_text())['grammars']['dyn']
repository=settings['repository'].removeprefix('https://github.com/').removesuffix('.git')
files=['grammar.js','src/parser.c','src/scanner.c','src/grammar.json','src/node-types.json']
report={'repository':settings['repository'],'revision':settings['rev'],'files':{}}
for name in files:
    url=f'https://raw.githubusercontent.com/{repository}/{settings["rev"]}/{name}'
    try:
        with urllib.request.urlopen(url,timeout=15) as response: remote=response.read()
        local=(ROOT/name).read_bytes()
        report['files'][name]={'match':remote==local,'remote_sha256':hashlib.sha256(remote).hexdigest(),'local_sha256':hashlib.sha256(local).hexdigest()}
    except Exception as error:
        report['files'][name]={'match':False,'error':str(error)}
output=args.output
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
raise SystemExit(0 if all(item['match'] for item in report['files'].values()) else 1)
