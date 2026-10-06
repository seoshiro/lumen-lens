# LUMEN — L–01

An original lens study. A warm studio, blue glass and nine carefully modeled component groups. Scrolling opens the presentation case, turns the lens, separates its layers, moves the nine-blade iris, and brings the object back together. Every transition works in reverse.

The lens geometry is an illustrative design, not an optically validated product. It makes no performance or commercial claims.

## Run locally

```sh
npm ci --ignore-scripts
npm run dev
```

Open `http://127.0.0.1:5413/`. Node 24 is used for the build and tests.

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

To run browser checks, start the dev server first, install Playwright Chromium (`npx playwright install chromium`), then run `npm run test:browser`. On Windows the check uses the existing Google Chrome installation. `LUMEN_URL` can point the same checks at the published site; `LUMEN_EVIDENCE` selects the capture directory.

`node scripts/capture-motion.mjs` records continuous desktop and mobile forward/reverse scroll sequences. It needs Playwright's free FFmpeg package (`npx playwright install ffmpeg`). Videos and frame telemetry are written outside the repository in `../evidence/motion`.

## How it works

- TypeScript, Vite and Three.js. No external services, analytics, video playback dependency or paid APIs.
- Original procedural geometry: convex glass surfaces, stepped hollow barrel profiles, engraving, thread lines, instanced fluting, screws, bayonet lugs and brass contacts.
- A pure scroll timeline drives every transform and iris blade. Browser scrolling remains native, including wheel, trackpad, touch, keyboard and reverse travel.
- The lens begins inside a closed presentation case. Its rear-hinged lid opens upward while the case stays in place, then the case fades out. Opening framing includes both the case and lid on desktop and mobile.
- English, Russian and Kazakh content. Fonts and model stills are served locally.
- Reduced motion collapses the animated journey to a static view and keeps the editorial content available. A failed WebGL context reveals model stills and readable notes.
- Rendering runs only when an update is needed. Pixel ratio is capped. No perpetual idle animation or render loop.

The component gallery uses original stills rendered from the same 3D model. Regenerate them from the local dev server with `node scripts/capture-stills.mjs`.

GitHub Actions runs lint, typecheck, timeline tests, build and browser checks before deploying to GitHub Pages. `/version.json` identifies the exact published source commit.

Regression checks cover the complete lid sweep, case seating, opening and reverse progress states, rapid wheel input, viewport resizing, asset failures and the Motion control bounds. The browser suite also checks captions against the visible case, rather than just the lens.

Three.js is MIT licensed. Inter and Bodoni Moda are distributed under the SIL Open Font License. Their license texts are included under `public/licenses`. All lens artwork and copy were made for this project; no reference-video or brand assets are included.
