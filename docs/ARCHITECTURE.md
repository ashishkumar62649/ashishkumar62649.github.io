# Architecture

This project is a static portfolio with a local-only visual editor.

The public website is intentionally simple: GitHub Pages serves `index.html`,
`styles.css`, JavaScript from `js/`, assets from `assets/`, and content from
`content/site.json`. No database, login, or hosted CMS is required.

The editor is a local development layer. It runs through `editor/local-server.js`
and unlocks editing features only when the page can reach
`/api/editor/status` on localhost. The live GitHub Pages site remains static.

## Runtime Flow

1. `index.html` loads an embedded `site-content-snapshot` as a fallback.
2. `js/content-store.js` tries to load `content/site.json`.
3. If JSON loading fails, the embedded snapshot is used.
4. `js/content-renderer.js` renders the portfolio sections.
5. `js/animations.js` attaches public site interactions.
6. When the local editor server is running, `js/editor-engine.js` enables edit
   mode, autosave, uploads, context actions, and editor controls.

## File Map

```text
index.html                  Static page shell and content snapshot
styles.css                  Public website styling and editor UI styling
content/site.json           Editable portfolio content
assets/                     Static images and uploaded files
editor/local-server.js      Local-only edit server and save/upload API
js/content-store.js         Defaults, content loading, autosave state, and shared helpers
js/editor-layout.js         Element links, layout selection, movement, lock, z-index
js/content-renderer.js      Renders portfolio sections from JSON content
js/editor-engine.js         Edit mode, inline editing, history, context menu, uploads
js/animations.js            Theme, menu, scroll, hero, and section animations
js/main.js                  Browser boot sequence
docs/                       Architecture and editor documentation
backups/                    Automatic content backups created before saves
```

## Public Site Versus Editor

The public site should work with only static files. Editor functionality must
stay optional and local:

```text
Public site = HTML + CSS + JS + content/site.json + assets
Local editor = public site + editor/local-server.js + localhost API
```

This separation keeps GitHub Pages deployment safe while still allowing direct
visual editing during local development.
