#!/usr/bin/env python
"""Stamp a build number onto every asset URL.

GitHub Pages serves assets with Cache-Control: max-age=600, so a browser will
happily run ten-minute-old JavaScript against freshly deployed HTML. That mixed
state is hard to spot — the page loads, it just quietly behaves like the old
build. On exercise day it could leave half the comms team on a stale version.

Stamping ?v=<n> onto the stylesheet, the entry script AND every relative import
inside the modules means one build is pinned end to end. Run before committing:

    python tools/bump.py
"""

import io, re, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERSION_FILE = os.path.join(ROOT, 'assets', 'VERSION')


def read_version():
    try:
        with io.open(VERSION_FILE, encoding='utf-8') as f:
            return int(f.read().strip())
    except Exception:
        return 0


def write_version(n):
    with io.open(VERSION_FILE, 'w', encoding='utf-8') as f:
        f.write(str(n) + '\n')


def stamp(path, patterns, version):
    with io.open(path, encoding='utf-8') as f:
        src = f.read()
    out = src
    for pat, repl in patterns:
        out = re.sub(pat, repl.replace('{V}', str(version)), out)
    if out != src:
        with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(out)
        return True
    return False


def main():
    version = int(sys.argv[1]) if len(sys.argv) > 1 else read_version() + 1
    changed = []

    # Relative imports inside the modules: from './util.js' -> './util.js?v=N'
    js_dir = os.path.join(ROOT, 'assets', 'js')
    for name in sorted(os.listdir(js_dir)):
        if not name.endswith('.js'):
            continue
        path = os.path.join(js_dir, name)
        if stamp(path, [(r"(from\s+['\"]\./[A-Za-z0-9_.-]+\.js)(\?v=\d+)?(['\"])",
                         r"\1?v={V}\3")], version):
            changed.append('assets/js/' + name)

    # Entry points in the HTML
    for page in ('jupiter.html',):
        path = os.path.join(ROOT, page)
        if not os.path.exists(path):
            continue
        if stamp(path, [(r"(assets/(?:css|js)/[A-Za-z0-9_.-]+\.(?:css|js))(\?v=\d+)?",
                         r"\1?v={V}"),
                        (r'<meta name="build" content="\d+">',
                         '<meta name="build" content="{V}">')], version):
            changed.append(page)

    write_version(version)
    print('build v%d' % version)
    for c in changed:
        print('  stamped', c)


if __name__ == '__main__':
    main()
