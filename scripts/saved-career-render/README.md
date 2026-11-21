# Saved-career rendering check

Use Node 22, installed Google Chrome and the workspace API and web dependencies. From the workspace root, export the shared synthetic learner once, then render it in the web checkout.

```sh
npm --prefix xtara-api run render:fixture -- --output /tmp/saved-career.json
npm --prefix xtara-web run verify:saved-career-ui -- --fixture /tmp/saved-career.json --output /tmp/saved-career-chrome
```

Use a fresh output directory for each run. The web driver normally starts its own API fixture responder. Supply `--api http://127.0.0.1:<port>/api/v1` to share one responder with the Flutter runner. Use `--chrome <executable>` to select a Chrome installation.

The driver copies current Next.js route modules and CSS into a temporary directory. That copy uses a synthetic Firebase user callback and locally packaged Inter. Authenticated domain requests still pass through the application HTTP client and Next.js proxy to the fixture. External browser requests are blocked. The original application keeps its production authentication and font configuration.

The walkthrough starts at the public page to measure the site gutter. It opens each saved career from the dashboard and opens Overview and Study & colleges, and compares each visible panel’s reading order with the authenticated API response. It verifies arrow-key selection, focus, stable scroll position, browser history and return to the correct panel. For a reviewed programme it opens the selected campus through both the career preview and the full study results, then verifies the exact programme and restored keyboard focus. For sparse coverage it verifies the API message in the college section. It checks English at 1512, 390 and 320 CSS pixels and a translated journey at 390 pixels with Chrome’s dark preference. While the release policy pins light appearance, the dark pass previews the shipped theme by applying the dark class in the disposable document. The manifest records this override in `usesThemePreview`.

`manifest.json` contains the fixture SHA-256, Chrome version, section order, measurements, named assertions and PNG filenames. The process exits unsuccessfully when a required assertion fails. The output directory retains the failed viewport, synthetic-page diagnostics and local server logs for inspection.
