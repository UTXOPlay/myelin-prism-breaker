# Prism Breaker browser controls 1.0.1

Touch play uses one finger anywhere on the canvas: horizontal dragging steers relative to the paddle, a short tap pulses, and deliberate upward diagonals bend left/right. Lifting preserves the final destination, and reversing at an edge responds immediately. A second finger cannot steal steering or accidentally cast. Cancellation, keyboard takeover, blur and resize clear the gesture. The rules still move the paddle at the original signed 19 units per tick; input targets do not teleport it.

Touch skill buttons and floating notices are hidden during play. Instructions appear before play and in the menu. Focus Lens is in Settings. Mouse steering uses the closest reachable native position without the former large dead zone; mouse clicks pulse. Desktop controls stay inside the scene outside the collision field. Rendering and pointer input share the same responsive transform.

Saving a new pickup previously compared JSON strings, so Rust's sorted object fields differed from browser insertion order and cleared a live drag despite identical game values. Reconciliation now compares JSON values recursively. Real corrections still replace predictions; no native rule, profile, level, engine or signed input format changes.

## Verification

`npm test` covers pointer ownership, quick release, edge reversal, reachable mouse targets, gesture discrimination and native/browser JSON ordering. `npm run build` creates the independent package.

Run browser acceptance against an isolated standalone host with a disposable data directory:

```sh
STORE_URL=http://127.0.0.1:19887 \
PLAYWRIGHT_ENTRY=/path/to/playwright/index.mjs \
CHROMIUM_PATH=/path/to/chrome \
node tests/prism-controls-browser.mjs
```

The harness uses Chromium mouse and CDP touch events at 1920×1080, 2560×1080, 2560×1440, 3840×2160, 390×844 and 844×390. It checks saving during a held drag, tap/bend actions, unobstructed paddle geometry, resize mapping, browser exceptions and native replay verification. Test-only getters are appended by request interception, never shipped. Screenshots and results go to `CONTROL_ARTIFACTS` or `/tmp/prism-controls/browser`. These are emulated browser checks, not physical iPhone/Android measurements.

## Production compatibility

Deploy only the independent Prism service with the existing runtime executable and persistent data mount. Preserve the native executable SHA-256 `847dc361e27a904992f0a0fd42757e5d0c07b6d16932151e7c56dc9a52b51261`. Keep the previous image and a stopped-service data backup for rollback. Store and other game services need no restart.
