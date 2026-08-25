#!/usr/bin/env python
"""Pull the Jupiter content script out of the JavaScript into JSON.

Used to build the review document. Keeping this as a script rather than a
one-off means the review pack can be regenerated after any content change.

    python tools/extract_content.py [out.json]
"""

import io, re, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def unq(s):
    return s.replace("\\'", "'").replace('\\"', '"').replace('\\\\', '\\')


def field(line, name):
    m = re.search(r"\b" + name + r":\s*'((?:[^'\\]|\\.)*)'", line)
    return unq(m.group(1)) if m else None


def parse_posts(block):
    out = []
    for line in block.split('\n'):
        line = line.strip()
        if not line.startswith('{min:'):
            continue
        m = re.match(r"\{min:(-?\d+)", line)
        if not m:
            continue
        out.append({
            'min': int(m.group(1)),
            'plat': field(line, 'plat'),
            'who': field(line, 'who'),
            'text': field(line, 'text'),
            'note': field(line, 'note'),
            'packRef': field(line, 'packRef'),
            'img': field(line, 'img'),
            'enquiry': 'enquiry:true' in line,
        })
    return out


def main():
    src = io.open(os.path.join(ROOT, 'assets/js/scenario-jupiter.js'), encoding='utf-8').read()

    def between(a, b):
        i = src.find(a)
        j = src.find(b, i)
        return src[i:j]

    baseline = parse_posts(between('export const BASELINE', 'export const SCRIPT'))
    script = parse_posts(between('export const SCRIPT', 'export const REACTIONS'))

    threads, cur = {}, None
    for line in src[src.find('export const THREADS'):].split('\n'):
        st = line.strip()
        k = re.match(r"^'?(-?\d+)'?:\s*\[", st)
        if k:
            cur = int(k.group(1))
            threads[cur] = []
            continue
        if cur is not None and st.startswith('{who:'):
            threads[cur].append({'who': field(st, 'who'), 'text': field(st, 'text')})
        if st == '};':
            cur = None

    pblock = io.open(os.path.join(ROOT, 'assets/js/personas.js'), encoding='utf-8').read()
    people = {}
    for m in re.finditer(r"^\s*(\w+):\s*\{name:'((?:[^'\\]|\\.)*)',\s*handle:'([^']*)'", pblock, re.M):
        people[m.group(1)] = {'name': unq(m.group(2)), 'handle': m.group(3)}

    data = {
        'baseline': baseline,
        'script': script,
        'threads': {str(k): v for k, v in threads.items()},
        'people': people,
    }

    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tools', 'jupiter-content.json')
    io.open(out, 'w', encoding='utf-8').write(json.dumps(data, ensure_ascii=False, indent=1))

    unknown = sorted({t['who'] for t in baseline + script if t['who'] not in people} |
                     {c['who'] for v in threads.values() for c in v if c['who'] not in people})
    print('baseline posts :', len(baseline))
    print('script posts   :', len(script))
    print('total posts    :', len(baseline) + len(script))
    print('threads        :', len(threads))
    print('comments       :', sum(len(v) for v in threads.values()))
    print('personas       :', len(people))
    print('unknown keys   :', unknown or 'none')
    print('written        :', out)


if __name__ == '__main__':
    main()
