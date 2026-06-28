# Editor Engine

The editor engine lets the real portfolio page become editable when it is served
locally through `editor/local-server.js`.

## Activation

The browser checks `/api/editor/status` from localhost. If the server responds,
the editor UI is created and edit mode can be toggled. On GitHub Pages this API
does not exist, so the public website stays read-only.

## Main Pieces

```text
editor/local-server.js
```

Provides the local API:

- `GET /api/editor/status` confirms the editor is available.
- `GET /api/content` reads `content/site.json`.
- `POST /api/content` saves content, writes a backup, and updates the snapshot
  inside `index.html`.
- `POST /api/upload` stores image uploads in `assets/uploads/`.

```text
js/editor-engine.js
```

Handles editing behavior:

- edit mode toggle
- inline text editing
- block editing
- image replacement
- context menu actions
- autosave and manual save to `content/site.json`
- block history and global undo/redo

```text
js/editor-layout.js
```

Handles visual layout edits:

- selecting editable objects
- moving and rotating selected objects
- sending objects forward/backward
- locking and unlocking objects
- saving layout adjustments into `content.site.layout`

## Autosave

Edit actions save automatically through the local editor server. The toolbar
also includes an icon-only save button for an explicit save. The editor keeps
working through the same content state in the page without asking the user to
manage a separate draft.

Autosave sends the current content to `POST /api/content`. The server then:

1. backs up the previous `content/site.json` into `backups/`;
2. writes the new JSON to `content/site.json`;
3. replaces the embedded JSON snapshot in `index.html`.

## Images

Image uploads go through `POST /api/upload`. The server accepts common image
types, limits uploads to 5 MB, sanitizes filenames, and stores files under
`assets/uploads/`.

SVG uploads are allowed only when they do not contain script-like content.

## Undo And History

The editor keeps two history systems:

- Block history for focused section edits.
- Global history for broader edits such as layout changes, deletes, and adds.

Both are stored in `localStorage`, so they are local to the current browser.

## Design Rule

Editor code may enhance the website, but the public website must never require
the editor server. If the localhost API is unavailable, the page should still
render normally.
