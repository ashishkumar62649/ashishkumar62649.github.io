const defaultContent = {
  meta: {
    siteTitle: "Ashish Kumar | Student Developer",
    description: "Ashish Kumar is a student developer working across AI, data, and systems."
  },
  hero: {
    name: "Ashish Kumar",
    title: "Student Developer",
    identity: "AI & Data Science Student",
    subtitle: "",
    location: "Bangalore, India",
    year: "2018",
    internshipStatus: "Open to internships",
    image: "./assets/portrait.jpg",
    decorations: {
      star: "./assets/tool-star.png",
      lightning: "./assets/tool-lightning.png"
    },
    buttons: [
      { text: "View Projects", url: "#projects" },
      { text: "Contact", url: "#contact" }
    ]
  },
  backgrounds: {
    light: "",
    dark: "./assets/dark-globe-wallpaper.jpg"
  },
  about: {
    heading: "Hey!",
    intro: "I'm Ashish, an AI & Data Science student developer building with Python, data, machine learning, automation, and systems.",
    secondary: "I'm focused on building practical, useful systems that turn messy data and workflows into clear tools.",
    status: "I'm currently open to internships across AI, Data Science, Machine Learning, Analytics, Python Development, Software Development, and Research.",
    ctaText: "Get Started",
    ctaLink: "mailto:hello@example.com"
  },
  approach: {
    text: "From data to decisions. Clean, practical AI systems built to understand patterns, simplify workflows, and turn thoughtful engineering into real-world clarity."
  },
  sectionLabels: {
    projectsKicker: "/Selected work",
    projectsHeading: "Projects",
    learningKicker: "/Learning log",
    learningHeading: "Learning",
    notesKicker: "/Research & notes",
    notesHeading: "Notes",
    stackSymbol: "*",
    stackTitle: "MY STACK"
  },
  navigation: [
    { text: "About Me", url: "#about" },
    { text: "Skills", url: "#skills" },
    { text: "Projects", url: "#projects" },
    { text: "Learning", url: "#learning" },
    { text: "Notes", url: "#notes" },
    { text: "Contact", url: "#contact" }
  ],
  projects: [],
  skills: [],
  learning: [],
  notes: [],
  contact: {
    heading: "Let's talk.",
    text: "Have a project, internship opportunity, or research idea? Send a note and I'll get back to you soon.",
    email: "hello@example.com",
    github: "#",
    linkedin: "#",
    resume: "#",
    buttonText: "Submit",
    formLabels: {
      name: "Name",
      email: "Email",
      project: "Your Project"
    },
    formPlaceholders: {
      name: "Enter your name",
      email: "Enter your email",
      project: "Tell us about your project"
    },
    socialLinks: []
  },
  footer: {
    text: "Building<br />AI, Data<br />&amp; Systems.",
    copyrightText: "ASHISH",
    quickLinksHeading: "/Quick links",
    contactHeading: "/Contact",
    quickLinks: [
      { text: "Home", url: "#home" },
      { text: "About Me", url: "#about" },
      { text: "Projects", url: "#projects" },
      { text: "Skills", url: "#skills" },
      { text: "Learning", url: "#learning" },
      { text: "Notes", url: "#notes" },
      { text: "Contact", url: "#contact" }
    ]
  },
  elementLinks: {},
  layout: {}
};

const draftKey = "portfolio-editor-draft";
const historyKey = "portfolio-editor-block-history";
const globalHistoryKey = "portfolio-editor-global-history";
let savedContent = structuredClone(defaultContent);
let draftContent = structuredClone(defaultContent);
let blockHistories = {};
let globalHistory = { past: [], future: [] };
let editorAvailable = false;
let editMode = false;
let activeEditable = null;
let activeGroup = null;
let contextLinkTarget = null;
let phaseWords = [];
let stackRows = [];
let inlineControlFrame = 0;
let selectedLayoutKeys = [];
let activeLayoutGesture = null;
const layoutSnap = 8;
const rotateSnap = 5;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
const normalizeArray = (value) => Array.isArray(value) ? value : [];
const toList = (value) => Array.isArray(value) ? value : String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
})[char]);
const linkArrow = `<span class="link-arrow" aria-hidden="true">&nearr;</span>`;
const isRichText = (value) => value && typeof value === "object" && !Array.isArray(value) && "text" in value;
const richText = (value) => isRichText(value) ? String(value.text ?? "") : String(value ?? "");
const richLinks = (value) => isRichText(value) && Array.isArray(value.links) ? value.links : [];
const renderLinkedText = (value) => {
  const source = richText(value);
  const links = richLinks(value).filter((link) => link?.text && link?.url);
  if (links.length === 0) return escapeHtml(source).replace(/\n/g, "<br>");

  const ranges = [];
  links.forEach((link) => {
    const index = source.indexOf(link.text);
    if (index >= 0 && !ranges.some((range) => index < range.end && index + link.text.length > range.start)) {
      ranges.push({ start: index, end: index + link.text.length, link });
    }
  });
  ranges.sort((a, b) => a.start - b.start);

  let output = "";
  let cursor = 0;
  ranges.forEach((range) => {
    output += escapeHtml(source.slice(cursor, range.start)).replace(/\n/g, "<br>");
    output += `<a class="inline-text-link" href="${escapeHtml(range.link.url)}">${escapeHtml(source.slice(range.start, range.end)).replace(/\n/g, "<br>")}${linkArrow}</a>`;
    cursor = range.end;
  });
  output += escapeHtml(source.slice(cursor)).replace(/\n/g, "<br>");
  return output;
};
const setEditableHtml = (selector, value, pathValue) => {
  const element = $(selector);
  if (!element) return;
  element.innerHTML = renderLinkedText(value);
  if (pathValue) element.dataset.editPath = pathValue;
};

const mergeContent = (content = {}) => ({
  ...structuredClone(defaultContent),
  ...content,
  meta: { ...defaultContent.meta, ...content.meta },
  hero: {
    ...defaultContent.hero,
    ...content.hero,
    decorations: { ...defaultContent.hero.decorations, ...content.hero?.decorations }
  },
  backgrounds: { ...defaultContent.backgrounds, ...content.backgrounds },
  about: { ...defaultContent.about, ...content.about },
  approach: { ...defaultContent.approach, ...content.approach },
  sectionLabels: { ...defaultContent.sectionLabels, ...content.sectionLabels },
  navigation: normalizeArray(content.navigation).length ? normalizeArray(content.navigation) : structuredClone(defaultContent.navigation),
  contact: {
    ...defaultContent.contact,
    ...content.contact,
    formLabels: { ...defaultContent.contact.formLabels, ...content.contact?.formLabels },
    formPlaceholders: { ...defaultContent.contact.formPlaceholders, ...content.contact?.formPlaceholders }
  },
  footer: { ...defaultContent.footer, ...content.footer },
  elementLinks: { ...defaultContent.elementLinks, ...content.elementLinks },
  layout: { ...defaultContent.layout, ...content.layout },
  projects: normalizeArray(content.projects),
  skills: normalizeArray(content.skills),
  learning: normalizeArray(content.learning),
  notes: normalizeArray(content.notes)
});

const getPath = (object, pathValue) => pathValue.split(".").reduce((current, key) => current?.[key], object);
const setPath = (object, pathValue, value) => {
  const parts = pathValue.split(".");
  let current = object;
  parts.slice(0, -1).forEach((part, index) => {
    if (current[part] == null) current[part] = /^\d+$/.test(parts[index + 1]) ? [] : {};
    current = current[part];
  });
  current[parts.at(-1)] = value;
};

const editableGroupPathMap = {
  "hero-title": ["hero.title"],
  "hero-year": ["hero.year"],
  "hero-location": ["hero.location"],
  "about-left": ["about.heading", "about.intro"],
  "about-right": ["about.secondary", "about.status", "about.ctaText"],
  "approach": ["approach.text"],
  "projects-heading": ["sectionLabels.projectsKicker", "sectionLabels.projectsHeading"],
  "learning-heading": ["sectionLabels.learningKicker", "sectionLabels.learningHeading"],
  "notes-heading": ["sectionLabels.notesKicker", "sectionLabels.notesHeading"],
  "contact-copy": ["contact.heading", "contact.text"],
  "footer-heading": ["footer.text"]
};

const saveBlockHistories = () => {
  if (editorAvailable) localStorage.setItem(historyKey, JSON.stringify(blockHistories));
};

const getGroupPaths = (group) => {
  if (editableGroupPathMap[group]) return editableGroupPathMap[group];
  if (group === "hero-image") return ["hero.image"];
  if (group?.startsWith("project-")) {
    const index = group.split("-").at(-1);
    return [
      `projects.${index}.title`,
      `projects.${index}.category`,
      `projects.${index}.shortDescription`,
      `projects.${index}.longDescription`,
      `projects.${index}.techStack`,
      `projects.${index}.githubLink`,
      `projects.${index}.liveDemoLink`,
      `projects.${index}.image`,
      `projects.${index}.whatILearned`
    ];
  }
  if (group?.startsWith("learning-")) {
    const index = group.split("-").at(-1);
    return [
      `learning.${index}.title`,
      `learning.${index}.type`,
      `learning.${index}.provider`,
      `learning.${index}.status`,
      `learning.${index}.link`,
      `learning.${index}.description`,
      `learning.${index}.image`
    ];
  }
  if (group?.startsWith("note-")) {
    const index = group.split("-").at(-1);
    return [
      `notes.${index}.title`,
      `notes.${index}.category`,
      `notes.${index}.summary`,
      `notes.${index}.content`,
      `notes.${index}.tags`,
      `notes.${index}.date`,
      `notes.${index}.readingTime`
    ];
  }
  if (group?.startsWith("skills-")) {
    return ["skills"];
  }
  if (group?.startsWith("background-")) return [`backgrounds.${group.slice("background-".length)}`];
  return [];
};

const snapshotPaths = (paths) => paths.reduce((snapshot, pathValue) => {
  snapshot[pathValue] = structuredClone(getPath(draftContent, pathValue));
  return snapshot;
}, {});

const applySnapshot = (snapshot) => {
  Object.entries(snapshot || {}).forEach(([pathValue, value]) => setPath(draftContent, pathValue, structuredClone(value)));
};

const snapshotsEqual = (a, b) => JSON.stringify(a || {}) === JSON.stringify(b || {});

const ensureHistory = (group) => {
  blockHistories[group] = blockHistories[group] || { past: [], future: [] };
  return blockHistories[group];
};

const contentSnapshot = () => structuredClone(draftContent);

const saveGlobalHistory = () => {
  if (editorAvailable) localStorage.setItem(globalHistoryKey, JSON.stringify(globalHistory));
};

const pushGlobalHistory = (snapshot = contentSnapshot()) => {
  const current = JSON.stringify(snapshot);
  const last = globalHistory.past.at(-1);
  if (last && JSON.stringify(last) === current) return;
  globalHistory.past.push(structuredClone(snapshot));
  globalHistory.past = globalHistory.past.slice(-10);
  globalHistory.future = [];
  saveGlobalHistory();
};

const makeRichValue = (text, links) => {
  const cleanLinks = normalizeArray(links)
    .filter((link) => link?.text && link?.url)
    .map((link) => ({ text: String(link.text), url: String(link.url) }));
  return cleanLinks.length > 0 ? { text, links: cleanLinks } : text;
};

const fetchJson = async (url) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${url}`);
  return response.json();
};

const readEmbeddedContent = () => {
  const snapshot = $("#site-content-snapshot");
  if (!snapshot?.textContent?.trim()) return null;
  return JSON.parse(snapshot.textContent);
};

const loadContent = async () => {
  try {
    savedContent = mergeContent(await fetchJson("./content/site.json"));
  } catch {
    try {
      savedContent = mergeContent(readEmbeddedContent());
    } catch {
      savedContent = structuredClone(defaultContent);
    }
  }

  localStorage.removeItem(draftKey);
  draftContent = structuredClone(savedContent);

  try {
    blockHistories = JSON.parse(localStorage.getItem(historyKey) || "{}") || {};
  } catch {
    blockHistories = {};
  }

  try {
    globalHistory = JSON.parse(localStorage.getItem(globalHistoryKey) || "null") || { past: [], future: [] };
    globalHistory.past = normalizeArray(globalHistory.past).slice(-10);
    globalHistory.future = normalizeArray(globalHistory.future).slice(-10);
  } catch {
    globalHistory = { past: [], future: [] };
  }
};

const checkEditor = async () => {
  if (!isLocalHost) return;
  try {
    editorAvailable = Boolean((await fetchJson("/api/editor/status"))?.running);
  } catch {
    editorAvailable = false;
  }
};

