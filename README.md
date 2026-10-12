# MUZIK

A music studio app that runs in the browser (formerly SAM-PLE / Sample, titled "Spectrum" in-app; now rebranded MUZIK). It was built in Grok's app builder.

- Original live URL: https://sam-ple.grok.me/studio.html
- Exported from the hosted Grok site on 2026-10-12. Original paths were kept.

`studio.html` is self-contained: all of its JS and CSS is inline. The root `index.html` is the Grok app shell, a Vite bundle in `assets/`, and it embeds `/studio.html`. `playground.html` (MUZIK Room: Tank, Bounce Jam, Paint Loop) is linked from `studio.html` and uses the shared `audio.js`.

External dependency (not vendored): `https://grok.com/grok-app-builder/extensions.js`, which the index.html shell loads.

Run locally: `python3 -m http.server` and open http://localhost:8000/studio.html
