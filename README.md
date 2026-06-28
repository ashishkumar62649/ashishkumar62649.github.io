# Ashish Kumar Portfolio

A static, editable portfolio website built for students, developers, and builders who want a polished personal site without needing a full CMS.

This project is designed around one simple idea: the public website stays fast and static, while the local editing mode lets you update text, images, links, skills, projects, learning notes, and contact content directly from the page.

## Live Site

https://ashishkumar62649.github.io

## What This Includes

- A dark/light portfolio design
- Local-only visual edit mode
- Click-to-edit text areas
- Image replacement for profile, background, project, and skill images
- Link editing and link removal
- Global undo/redo while editing
- Local autosave while editing
- Content stored in `content/site.json`
- Static deployment through GitHub Pages

## Local Editing

Install dependencies if needed:

```bash
npm install
```

Start the local editor server:

```bash
npm run edit
```

Then open:

```text
http://127.0.0.1:3000
```

The edit button appears only when the site is running locally through the editor server. This keeps the public GitHub Pages version static and safe.

## How To Customize

Most content lives in:

```text
content/site.json
```

Images and uploaded assets live in:

```text
assets/
assets/uploads/
```

Main files:

```text
index.html
styles.css
js/
content/site.json
editor/local-server.js
```

You can edit the site visually using edit mode, or update the JSON/CSS/HTML directly.

## Project Structure

```text
index.html                  Static page shell and embedded content snapshot
styles.css                  Website and editor styling
js/content-store.js         Defaults, content loading, autosave state, shared helpers
js/editor-layout.js         Layout selection, movement, locking, element links
js/content-renderer.js      Renders the portfolio from JSON
js/editor-engine.js         Local edit mode, inline editing, uploads, history
js/animations.js            Public interactions and scroll animations
js/main.js                  App boot sequence
content/site.json           Editable content source
editor/local-server.js      Local-only editor server
docs/                       Architecture and editor documentation
```

For a deeper explanation, see:

```text
docs/ARCHITECTURE.md
docs/EDITOR_ENGINE.md
docs/CONTENT_SCHEMA.md
```

## Publishing

After editing locally:

```bash
git add -A
git commit -m "Update portfolio"
git push
```

GitHub Pages will publish the static site from the repository.

## Credit

You are welcome to fork, copy, customize, and build your own version from this project.

Please keep credit to the original creator:

```text
Original portfolio system by Ashish Kumar
https://github.com/ashishkumar62649/ashishkumar62649.github.io
```

A small footer credit, README credit, or repository attribution is enough.

## Notes

This project is intentionally simple. It does not require a database, login system, dashboard, or paid CMS. The editing workflow is local-first, and the public website remains static.
