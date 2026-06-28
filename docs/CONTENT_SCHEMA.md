# Content Schema

The portfolio content lives in `content/site.json`. The browser merges this file
with defaults from `js/content-store.js`, so missing optional fields fall back to
safe values.

## Top-Level Fields

```text
meta            Browser title and description
hero            First viewport content, hero image, location, decorations
backgrounds     Light and dark background image paths
about           About section copy and call-to-action
approach        Large scroll-filled statement
sectionLabels   Section headings and labels
navigation      Header navigation links
projects        Project cards
skills          Stack categories and skill pills
learning        Learning log items
notes           Research/note cards
contact         Contact copy, form labels, social links, email
footer          Footer text and quick links
elementLinks    Optional links attached to editable text elements
layout          Optional visual layout overrides from edit mode
```

## Rich Text Values

Most text fields can be either a plain string or a rich text object:

```json
{
  "text": "Portfolio System",
  "links": [
    {
      "text": "System",
      "url": "https://example.com"
    }
  ]
}
```

The `text` value is rendered as normal copy. Each link attaches to the first
matching text range.

## Collections

Projects, skills, learning items, notes, social links, navigation links, and
footer links are arrays. The renderer uses array order as display order.

## Layout Overrides

The editor stores visual adjustments in `layout` by element key:

```json
{
  "skill.0": {
    "x": 16,
    "y": -8,
    "rotate": 5,
    "z": 1,
    "locked": false
  }
}
```

If all layout values are at their defaults, the entry is removed. This keeps the
JSON clean and makes reset behavior predictable.

## Asset Paths

Use relative paths for local assets:

```text
./assets/portrait.jpg
./assets/uploads/example.png
```

External icon URLs are supported for skills and social links, but local assets
are safer for long-term portfolio stability.
