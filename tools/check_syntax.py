#!/usr/bin/env python
"""Catch JavaScript string literals broken across lines.

Editing these files through shell heredocs has twice turned an intended newline
escape into a real newline, splitting a string literal in half and taking the
whole page down with a SyntaxError. The browser only reports that after a
deploy. This catches it before committing.

    python tools/check_syntax.py
"""

import io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS_DIR = os.path.join(ROOT, 'assets', 'js')


def scan(src):
    """Return line numbers where a ' or " string is left open at end of line."""
    bad = []
    in_block = False
    for n, line in enumerate(src.split('\n'), 1):
        i = 0
        quote = None
        while i < len(line):
            ch = line[i]
            nxt = line[i + 1] if i + 1 < len(line) else ''

            if in_block:
                if ch == '*' and nxt == '/':
                    in_block = False
                    i += 2
                    continue
                i += 1
                continue

            if quote:
                if ch == '\\':
                    i += 2
                    continue
                if ch == quote:
                    quote = None
                i += 1
                continue

            if ch == '/' and nxt == '*':
                in_block = True
                i += 2
                continue
            if ch == '/' and nxt == '/':
                break                                  # line comment
            if ch == '/':
                # Regex literal if the previous non-space character opens an
                # expression. Skip to the closing slash so quotes inside a
                # character class do not look like string delimiters.
                prev = line[:i].rstrip()
                if not prev or prev[-1] in '(,=:[!&|?{;+':
                    j = i + 1
                    while j < len(line):
                        if line[j] == '\\':
                            j += 2
                            continue
                        if line[j] == '/':
                            break
                        j += 1
                    i = j + 1
                    continue
            if ch in ('"', "'", '`'):
                quote = ch
            i += 1

        # backticks may legitimately span lines; quotes never may
        if quote in ('"', "'"):
            bad.append((n, line.strip()[:90]))
    return bad


def main():
    problems = []
    for name in sorted(os.listdir(JS_DIR)):
        if not name.endswith('.js'):
            continue
        src = io.open(os.path.join(JS_DIR, name), encoding='utf-8').read()
        for n, text in scan(src):
            problems.append('assets/js/%s:%d  %s' % (name, n, text))

    if problems:
        print('BROKEN STRING LITERALS:')
        for p in problems:
            print('  ' + p)
        sys.exit(1)
    print('syntax check: %d files, no broken string literals'
          % len([f for f in os.listdir(JS_DIR) if f.endswith('.js')]))


if __name__ == '__main__':
    main()
