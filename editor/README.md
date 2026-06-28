# Local Editor

The editor is a local-only layer for changing the static portfolio directly from
the page.

Start it from the project root:

```bash
npm run edit
```

Then open:

```text
http://127.0.0.1:3000
```

The editor button appears only when the page is served by this local server.
The public GitHub Pages version does not expose the editor API.

## API

```text
GET  /api/editor/status
GET  /api/content
POST /api/content
POST /api/upload
POST /api/reset
```

`POST /api/reset` intentionally returns `501`; restore from `backups/` if a
manual rollback is needed.

## Save Behavior

Every content save creates a timestamped backup in `backups/`, writes
`content/site.json`, and updates the JSON snapshot embedded in `index.html`.
