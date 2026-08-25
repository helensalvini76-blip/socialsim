# MediaSim / socialsim

Simulated social media platform for live crisis exercises. Runs on GitHub Pages
at **mediasim.bcrconsultants.co.uk**.

| Page | What it is |
|---|---|
| `index.html` | The existing tool. Firebase-backed, multi-device, five built-in scenarios. Untouched. |
| `jupiter.html` | **Exercise Jupiter** build (The Kirkwood, 10 Sept 2026). Rebuilt participant view. |

## Exercise Jupiter build

    jupiter.html
    assets/css/app.css              layout and platform chrome
    assets/js/personas.js           cast (all individuals invented)
    assets/js/scenario-jupiter.js   inject script, phases, reaction pools
    assets/js/feeds.js              X / Facebook / Instagram renderers
    assets/js/engine.js             exercise clock, pacing, reaction engine
    assets/js/app.js                participant app and facilitator preview bar

## Links

| Who | URL |
|---|---|
| Comms team | `jupiter.html` |
| Facilitator | `dashboard.html` (passphrase `jupiter2026`, or `?key=jupiter2026`) |
| Preview on one device | `jupiter.html?offline=1` |
| Separate run | add `?session=dryrun` to both |

The dashboard passphrase is obfuscation, not security — the page is public, so
anyone determined can read it out of the source. It stops the realistic problem:
someone opening the controls by accident and resetting a live exercise. To
change it, run `hash('new phrase')` from `rng.js` in the console and replace
`PASS_HASH` in `assets/js/gate.js`.

Fire location is a single constant, `FIRE_LOCATION` in `scenario-jupiter.js` —
change it in one place when the location is agreed.

Comment threads are hand-written per post in `THREADS` in the same file, keyed
by the post's minute. Do not generate them from pools — that produced comments
about the fire underneath a pre-incident post about strawberries.

## Before every commit

    python tools/check_syntax.py     # catches string literals broken across lines
    python tools/bump.py             # stamps a build number on every asset

GitHub Pages caches assets for 10 minutes, so without the build stamp a browser
will happily run old JavaScript against new HTML — which looks like nothing
changed rather than like an error.

To regenerate the content review document:

    python tools/extract_content.py tools/jupiter-content.json
    python tools/build_review_doc.py tools/jupiter-content.json "out.docx"
