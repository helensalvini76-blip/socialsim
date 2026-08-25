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

Add `?f=1` to the URL for the facilitator preview bar (clock, speed, phase jump,
watermark toggle, reset). Participants use the plain URL.

Fire location is a single constant, `FIRE_LOCATION` in `scenario-jupiter.js` —
change it in one place when the location is agreed.
