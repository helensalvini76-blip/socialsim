#!/usr/bin/env python
"""Pull the Jupiter content script out of the JavaScript into JSON.

Feeds the review document. Keeping it as a script rather than a one-off means
the review pack can be regenerated after any content change.

    python tools/extract_content.py [out.json]

Exits non-zero if any entry fails to parse or references an unknown persona, so
a content change that quietly drops posts from the review document is noticed.
"""

import io, re, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def unq(s):
    return s.replace("\\'", "'").replace('\\"', '"').replace('\\\\', '\\')


def field(text, name):
    m = re.search(r"\b" + name + r":\s*'((?:[^'\\]|\\.)*)'", text)
    return unq(m.group(1)) if m else None


def parse_posts(block):
    """Entries may be written on one line or spread across several, so gather
    each {min: ...} object into one string before reading its fields."""
    entries, cur = [], None
    for raw in block.split('\n'):
        line = raw.strip()
        if cur is None:
            if not line.startswith('{min:'):
                continue
            cur = line
        else:
            cur += ' ' + line
        if cur.count('{') <= cur.count('}'):      # braces balanced: entry complete
            entries.append(cur)
            cur = None

    out = []
    for e in entries:
        m = re.match(r"\{min:(-?\d+)", e)
        if not m:
            continue
        out.append({
            'min': int(m.group(1)),
            'plat': field(e, 'plat'),
            'who': field(e, 'who'),
            'text': field(e, 'text'),
            'note': field(e, 'note'),
            'packRef': field(e, 'packRef'),
            'img': field(e, 'img'),
            'via': field(e, 'via'),
            'subject': field(e, 'subject'),
            'enquiry': 'enquiry:true' in e,
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
    # Staff group and enquiry inbox live in their own block
    script += parse_posts(between('export const CHANNEL_SCRIPT', 'export const REPLY_REACTIONS'))

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

    allp = baseline + script
    notext = [p for p in allp if not p.get('text')]
    unknown = sorted({t['who'] for t in allp if t['who'] and t['who'] not in people} |
                     {c['who'] for v in threads.values() for c in v if c['who'] not in people})

    print('baseline posts :', len(baseline))
    print('script posts   :', len(script))
    print('total posts    :', len(allp))
    print('threads        :', len(threads))
    print('comments       :', sum(len(v) for v in threads.values()))
    print('personas       :', len(people))
    print('unknown keys   :', unknown or 'none')
    print('failed to parse:', [(p['min'], p['plat']) for p in notext] or 'none')
    print('written        :', out)

    if notext or unknown:
        sys.exit(1)


if __name__ == '__main__':
    main()
