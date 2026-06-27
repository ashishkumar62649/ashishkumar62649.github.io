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
- Draft saving before final publish
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
script.js
editor/local-server.js
```

You can edit the site visually using edit mode, or update the JSON/CSS/HTML directly.

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

