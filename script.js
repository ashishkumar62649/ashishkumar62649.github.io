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
  elementLinks: {}
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

  try {
    const storedDraft = JSON.parse(localStorage.getItem(draftKey) || "null");
    draftContent = storedDraft?.version === 2 && storedDraft.content
      ? mergeContent(storedDraft.content)
      : structuredClone(savedContent);
  } catch {
    draftContent = structuredClone(savedContent);
  }

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

const currentContent = () => draftContent;
const saveDraft = () => {
  if (editorAvailable) {
    localStorage.setItem(draftKey, JSON.stringify({
      version: 2,
      content: draftContent
    }));
  }
};

const setText = (selector, value, pathValue) => {
  const element = $(selector);
  if (!element) return;
  element.textContent = richText(value);
  if (pathValue) element.dataset.editPath = pathValue;
};

const setHref = (element, href) => {
  if (element) element.href = href || "#";
};

const setEditable = (element, pathValue, kind = "text") => {
  if (!element || !pathValue) return;
  element.dataset.editPath = pathValue;
  element.dataset.editKind = kind;
};

const setLinkTarget = (element, key) => {
  if (!element || !key) return;
  element.dataset.linkKey = key;
};

const getElementLink = (pathValue) => draftContent.elementLinks?.[pathValue] || "";

const setElementLink = (pathValue, url) => {
  draftContent.elementLinks = draftContent.elementLinks || {};
  if (url) {
    draftContent.elementLinks[pathValue] = url;
  } else {
    delete draftContent.elementLinks[pathValue];
  }
};

const applyElementLinks = () => {
  const links = draftContent.elementLinks || {};
  Object.entries(links).forEach(([pathValue, url]) => {
    if (!url) return;
    const element = findEditableElement(pathValue) || $(`[data-link-key="${CSS.escape(pathValue)}"]`);
    if (!element) return;
    element.dataset.hasLink = "true";
    if (element.matches("a")) {
      element.href = url;
      return;
    }
    if (element.closest("[data-element-link-wrap]")) return;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.className = "element-link-wrap";
    anchor.dataset.elementLinkWrap = pathValue;
    anchor.dataset.hasLink = "true";
    element.replaceWith(anchor);
    anchor.appendChild(element);
  });
};

const setEditGroup = (element, group, label = "Edit") => {
  if (!element || !group) return;
  element.dataset.editGroup = group;
  element.dataset.editLabel = label;
};

const renderTitle = (title) => {
  const lines = richText(title || "Student Developer")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const heroTitle = $("[data-hero-title]");
  if (!heroTitle) return;
  heroTitle.setAttribute("aria-label", lines.join(" "));
  heroTitle.innerHTML = lines.map((line) => `<span class="title-line">${escapeHtml(line.toUpperCase())}</span>`).join("");
  setEditable(heroTitle, "hero.title");
  setEditGroup(heroTitle, "hero-title", "Edit hero title");
};

const renderNavigation = () => {
  const panel = $(".menu-panel");
  if (!panel) return;
  panel.innerHTML = normalizeArray(currentContent().navigation).map((link, index) =>
    `<a href="${escapeHtml(link.url || "#")}" data-edit-path="navigation.${index}.text">${renderLinkedText(link.text)}</a>`
  ).join("");
};

const renderApproachText = (value) => {
  const element = $(".phase-three-text");
  if (!element) return;
  element.dataset.fillText = richText(value || defaultContent.approach.text);
  element.textContent = element.dataset.fillText;
  setEditable(element, "approach.text", "long");
  setEditGroup(element, "approach", "Edit approach");
};

const editorIcon = (pathValue, kind = "text", label = "Edit") =>
  "";

const deleteIcon = (type, index) =>
  editorAvailable ? `<button class="inline-delete-icon" type="button" data-delete-card="${type}" data-delete-index="${index}" aria-label="Delete" title="Delete">×</button>` : "";

const addIcon = (type) =>
  editorAvailable ? `<button class="inline-add-icon" type="button" data-add-card="${type}" aria-label="Add ${type}" title="Add ${type}">+</button>` : "";

const renderProjects = () => {
  const list = $("[data-projects-list]");
  const content = currentContent();
  if (!list) return;
  list.innerHTML = content.projects.map((project, index) => `
    <article class="project-card editable-card" data-edit-group="project-${index}">
      ${project.image ? `<div class="editable-image-wrap"><img src="${escapeHtml(project.image)}" alt="" data-edit-path="projects.${index}.image" data-edit-kind="image" /></div>` : `<div class="project-image-placeholder editable-image-wrap" data-edit-path="projects.${index}.image" data-edit-kind="image"></div>`}
      <div>
        ${editorIcon(`projects.${index}.category`)}<p data-edit-path="projects.${index}.category">${renderLinkedText(project.category)}</p>
        ${editorIcon(`projects.${index}.title`)}<h3 data-edit-path="projects.${index}.title">${renderLinkedText(project.title)}</h3>
        ${editorIcon(`projects.${index}.shortDescription`)}<p data-edit-path="projects.${index}.shortDescription">${renderLinkedText(project.shortDescription)}</p>
        ${editorIcon(`projects.${index}.longDescription`, "long")}<p data-edit-path="projects.${index}.longDescription" data-edit-kind="long">${renderLinkedText(project.longDescription)}</p>
        ${editorIcon(`projects.${index}.techStack`, "list")}<div class="tag-row" data-edit-path="projects.${index}.techStack" data-edit-kind="list">${toList(project.techStack).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        ${editorIcon(`projects.${index}.whatILearned`, "long")}<p class="learned" data-edit-path="projects.${index}.whatILearned" data-edit-kind="long">${renderLinkedText(project.whatILearned)}</p>
        <div class="inline-links">
          ${project.githubLink && project.githubLink !== "#" ? `<a class="link-with-arrow" href="${escapeHtml(project.githubLink)}">GitHub ${linkArrow}</a>` : ""}
          ${project.liveDemoLink && project.liveDemoLink !== "#" ? `<a class="link-with-arrow" href="${escapeHtml(project.liveDemoLink)}">Live demo ${linkArrow}</a>` : ""}
        </div>
      </div>
      ${deleteIcon("project", index)}
    </article>
  `).join("") || `<p class="empty-state">Selected projects will appear here.</p>`;
  list.insertAdjacentHTML("afterend", addIcon("project"));
};

const groupSkills = () => currentContent().skills.reduce((groups, skill, index) => {
  const category = skill.category || "Tools";
  groups[category] = groups[category] || [];
  groups[category].push({ skill, index });
  return groups;
}, {});

const renderSkills = () => {
  const list = $("[data-skills-list]");
  if (!list) return;
  const groups = groupSkills();
  list.innerHTML = Object.entries(groups).map(([category, rows]) => `
    <h3 data-edit-group="skills-${escapeHtml(category)}" data-edit-path="skills.${rows[0].index}.category" data-edit-kind="skill-category" data-edit-category="${escapeHtml(category)}">${escapeHtml(category)}</h3>
    <div class="stack-tools" data-edit-group="skills-${escapeHtml(category)}">
      ${rows.map(({ skill, index }) => `
        <div class="stack-tool editable-card">
          ${skill.icon ? `<img src="${escapeHtml(skill.icon)}" alt="" data-edit-path="skills.${index}.icon" data-edit-kind="image" />` : `<span class="skill-icon-placeholder" data-edit-path="skills.${index}.icon" data-edit-kind="image"></span>`}
          <span data-edit-path="skills.${index}.name" data-description-path="skills.${index}.description" title="${escapeHtml(richText(skill.description))}">${renderLinkedText(skill.name)}</span>
          ${deleteIcon("skill", index)}
        </div>
      `).join("")}
      <button class="category-add-tool" type="button" data-add-skill-category="${escapeHtml(category)}" aria-label="Add tool to ${escapeHtml(category)}" title="Add tool">+</button>
    </div>
  `).join("");
};

const renderLearning = () => {
  const list = $("[data-learning-list]");
  const content = currentContent();
  if (!list) return;
  list.innerHTML = content.learning.map((item, index) => `
    <article class="learning-item editable-card" data-edit-group="learning-${index}">
      ${item.image ? `<div class="editable-image-wrap"><img src="${escapeHtml(item.image)}" alt="" data-edit-path="learning.${index}.image" data-edit-kind="image" /></div>` : ""}
      <div>
        <p><span data-edit-path="learning.${index}.type">${renderLinkedText(item.type)}</span> / <span data-edit-path="learning.${index}.status">${renderLinkedText(item.status)}</span></p>
        <h3 data-edit-path="learning.${index}.title">${renderLinkedText(item.title)}</h3>
        <p data-edit-path="learning.${index}.description" data-edit-kind="long">${renderLinkedText(item.description)}</p>
        <span data-edit-path="learning.${index}.provider">${renderLinkedText(item.provider)}</span>
      </div>
      ${item.link && item.link !== "#" ? `<a class="link-with-arrow" href="${escapeHtml(item.link)}" data-edit-path="learning.${index}.link">Open ${linkArrow}</a>` : ""}
      ${deleteIcon("learning", index)}
    </article>
  `).join("") || `<p class="empty-state">Learning items will appear here.</p>`;
  list.insertAdjacentHTML("afterend", addIcon("learning"));
};

const renderNotes = () => {
  const list = $("[data-notes-list]");
  const content = currentContent();
  if (!list) return;
  list.innerHTML = content.notes.map((note, index) => `
    <article class="note-card editable-card" data-edit-group="note-${index}">
      <p><span data-edit-path="notes.${index}.category">${renderLinkedText(note.category)}</span> / <span data-edit-path="notes.${index}.date">${renderLinkedText(note.date)}</span> / <span data-edit-path="notes.${index}.readingTime">${renderLinkedText(note.readingTime)}</span></p>
      <h3 data-edit-path="notes.${index}.title">${renderLinkedText(note.title)}</h3>
      <p data-edit-path="notes.${index}.summary" data-edit-kind="long">${renderLinkedText(note.summary)}</p>
      <div class="tag-row" data-edit-path="notes.${index}.tags" data-edit-kind="list">${toList(note.tags).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
      <details>
        <summary>Read note</summary>
        <p data-edit-path="notes.${index}.content" data-edit-kind="long">${renderLinkedText(note.content)}</p>
      </details>
      ${deleteIcon("note", index)}
    </article>
  `).join("") || `<p class="empty-state">Research notes will appear here.</p>`;
  list.insertAdjacentHTML("afterend", addIcon("note"));
};

const renderContact = () => {
  const content = currentContent();
  setEditableHtml("[data-contact-heading]", content.contact.heading, "contact.heading");
  setEditableHtml("[data-contact-text]", content.contact.text, "contact.text");
  const button = $("[data-contact-button]");
  if (button) {
    button.textContent = content.contact.buttonText || "Submit";
    setEditable(button, "contact.buttonText");
  }
  const formLabelMap = [
    [".contact-form label:nth-child(1) span", "contact.formLabels.name", content.contact.formLabels.name],
    [".contact-form label:nth-child(2) span", "contact.formLabels.email", content.contact.formLabels.email],
    [".contact-form label:nth-child(3) span", "contact.formLabels.project", content.contact.formLabels.project]
  ];
  formLabelMap.forEach(([selector, pathValue, value]) => setText(selector, value, pathValue));
  const nameInput = $('.contact-form input[name="name"]');
  const emailInput = $('.contact-form input[name="email"]');
  const projectInput = $('.contact-form textarea[name="project"]');
  if (nameInput) {
    nameInput.placeholder = content.contact.formPlaceholders.name;
    setEditable(nameInput, "contact.formPlaceholders.name", "placeholder");
  }
  if (emailInput) {
    emailInput.placeholder = content.contact.formPlaceholders.email;
    setEditable(emailInput, "contact.formPlaceholders.email", "placeholder");
  }
  if (projectInput) {
    projectInput.placeholder = content.contact.formPlaceholders.project;
    setEditable(projectInput, "contact.formPlaceholders.project", "placeholder");
  }
  const socialLinks = $("[data-social-links]");
  if (socialLinks) {
    socialLinks.innerHTML = normalizeArray(content.contact.socialLinks).map((item, index) => `
      <a href="${escapeHtml(item.url || "#")}" aria-label="${escapeHtml(item.label)}" class="editable-card social-link-arrow" data-edit-path="contact.socialLinks.${index}.url" data-edit-kind="url">
        ${item.icon ? `<img src="${escapeHtml(item.icon)}" alt="" data-edit-path="contact.socialLinks.${index}.icon" data-edit-kind="image" />` : `<span data-edit-path="contact.socialLinks.${index}.label">${escapeHtml((item.label || "?").slice(0, 1))}</span>`}
        ${editorIcon(`contact.socialLinks.${index}.url`, "url", "Edit social link")}
      </a>
    `).join("");
  }
  const footerEmail = $("[data-footer-email]");
  if (footerEmail) {
    footerEmail.textContent = content.contact.email || "";
    footerEmail.href = `mailto:${content.contact.email || ""}`;
    setEditable(footerEmail, "contact.email");
  }
};

const renderFooter = () => {
  const content = currentContent();
  const footerHeading = $(".footer-heading h2");
  if (footerHeading) {
    footerHeading.innerHTML = content.footer.text || "";
    setEditable(footerHeading, "footer.text", "html");
  }
  setText("[data-footer-name]", content.footer.copyrightText, "footer.copyrightText");
  setText(".footer-links h3", content.footer.quickLinksHeading, "footer.quickLinksHeading");
  setText(".footer-contact h3", content.footer.contactHeading, "footer.contactHeading");
  const links = $(".footer-link-list");
  if (links) {
    links.innerHTML = normalizeArray(content.footer.quickLinks)
      .map((link, index) => `<a class="link-with-arrow" href="${escapeHtml(link.url)}" data-edit-path="footer.quickLinks.${index}.text">${renderLinkedText(link.text)} ${linkArrow}</a>`)
      .join("");
  }
};

const renderContent = () => {
  $$(".inline-add-icon").forEach((button) => button.remove());
  const content = currentContent();
  document.documentElement.style.setProperty("--light-background-image", content.backgrounds.light ? `url("${content.backgrounds.light}")` : "none");
  document.documentElement.style.setProperty("--dark-background-image", `url("${content.backgrounds.dark || "./assets/dark-globe-wallpaper.jpg"}")`);
  document.title = content.meta.siteTitle || defaultContent.meta.siteTitle;
  const description = $('meta[name="description"]');
  if (description) description.content = content.meta.description || defaultContent.meta.description;

  renderNavigation();
  setText("[data-site-brand]", richText(content.hero.name || "Ashish").split(" ")[0], "hero.name");
  setLinkTarget($(".theme-toggle"), "ui.themeToggle");
  renderTitle(content.hero.title);
  setText(".stack-kicker span", content.sectionLabels.stackSymbol, "sectionLabels.stackSymbol");
  setText(".stack-kicker p", content.sectionLabels.stackTitle, "sectionLabels.stackTitle");
  const starTool = $(".tool-star img");
  const lightningTool = $(".tool-lightning img");
  if (starTool) {
    starTool.src = content.hero.decorations.star || defaultContent.hero.decorations.star;
    delete starTool.dataset.editPath;
    delete starTool.dataset.editKind;
  }
  if (lightningTool) {
    lightningTool.src = content.hero.decorations.lightning || defaultContent.hero.decorations.lightning;
    delete lightningTool.dataset.editPath;
    delete lightningTool.dataset.editKind;
  }
  setText("[data-hero-location]", `#${content.hero.location || ""}`, "hero.location");
  setText("[data-hero-year]", `@${content.hero.year || "2018"}`, "hero.year");
  $("[data-hero-image]")?.setAttribute("src", content.hero.image || "./assets/portrait.jpg");
  $("[data-hero-image-back]")?.setAttribute("src", content.hero.image || "./assets/portrait.jpg");
  setEditable($("[data-hero-image]"), "hero.image", "image");
  setEditable($("[data-hero-image-back]"), "hero.image", "image");
  setEditGroup($(".flip-card"), "hero-image", "Replace hero image");
  $(".flip-card")?.setAttribute("data-edit-image-path", "hero.image");
  setEditGroup($("[data-hero-location]"), "hero-location", "Edit location");
  setEditGroup($("[data-hero-year]"), "hero-year", "Edit year");

  setEditableHtml("[data-about-heading]", content.about.heading, "about.heading");
  setEditableHtml("[data-about-intro]", content.about.intro, "about.intro");
  setEditableHtml("[data-about-secondary]", content.about.secondary, "about.secondary");
  setEditableHtml("[data-about-status]", content.about.status, "about.status");
  setEditGroup($(".phase-copy-left"), "about-left", "Edit intro");
  setEditGroup($(".phase-copy-right"), "about-right", "Edit about details");
  const cta = $("[data-about-cta]");
  if (cta) {
    cta.classList.add("link-with-arrow");
    cta.innerHTML = `${renderLinkedText(content.about.ctaText || "Get Started")} ${linkArrow}`;
    setHref(cta, content.about.ctaLink);
    setEditable(cta, "about.ctaText");
  }

  renderApproachText(content.approach.text);
  setEditableHtml("[data-projects-kicker]", content.sectionLabels.projectsKicker, "sectionLabels.projectsKicker");
  setEditableHtml("[data-projects-heading]", content.sectionLabels.projectsHeading, "sectionLabels.projectsHeading");
  setEditableHtml("[data-learning-kicker]", content.sectionLabels.learningKicker, "sectionLabels.learningKicker");
  setEditableHtml("[data-learning-heading]", content.sectionLabels.learningHeading, "sectionLabels.learningHeading");
  setEditableHtml("[data-notes-kicker]", content.sectionLabels.notesKicker, "sectionLabels.notesKicker");
  setEditableHtml("[data-notes-heading]", content.sectionLabels.notesHeading, "sectionLabels.notesHeading");
  setEditGroup($(".projects-section .section-heading"), "projects-heading", "Edit projects heading");
  setEditGroup($(".learning-section .section-heading"), "learning-heading", "Edit learning heading");
  setEditGroup($(".notes-section .section-heading"), "notes-heading", "Edit notes heading");

  renderSkills();
  renderProjects();
  renderLearning();
  renderNotes();
  renderContact();
  renderFooter();
  setEditGroup($(".contact-copy"), "contact-copy", "Edit contact copy");
  setEditGroup($(".footer-heading"), "footer-heading", "Edit footer heading");
  renderInlineControls();
  applyElementLinks();
  setupAnimationState();
};

const renderInlineControls = () => {
  if (!editorAvailable) return;
  $$(".inline-anchor").forEach((button) => button.remove());
  $$("[data-edit-group], [data-edit-path]").forEach((element) => element.classList.add("editable-target"));
  return;
  const seenGroups = new Set();
  $$("[data-edit-group]").forEach((element) => {
    const group = element.dataset.editGroup;
    if (!group || seenGroups.has(group)) return;
    seenGroups.add(group);
    element.classList.add("editable-target");
    const button = document.createElement("button");
    button.className = "inline-anchor";
    button.type = "button";
    button.dataset.inlineEditGroup = group;
    button.setAttribute("aria-label", "Edit");
    button.title = element.dataset.editLabel || "Edit";
    button.textContent = "✎";
    document.body.appendChild(button);
  });
  positionInlineControls();
};

const positionInlineControls = () => {
  if (!editorAvailable) return;
  $$(".inline-anchor").forEach((button) => {
    const group = button.dataset.inlineEditGroup;
    const targets = $$(`[data-edit-group="${CSS.escape(group)}"]`);
    const visibleRects = targets
      .map((target) => target.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth);

    if (visibleRects.length === 0) {
      button.classList.add("is-hidden");
      return;
    }

    const rect = {
      left: Math.min(...visibleRects.map((item) => item.left)),
      top: Math.min(...visibleRects.map((item) => item.top)),
      right: Math.max(...visibleRects.map((item) => item.right)),
      bottom: Math.max(...visibleRects.map((item) => item.bottom))
    };

    const isStyleVisible = targets.some((target) => {
      const style = window.getComputedStyle(target);
      return style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity || 1) > 0.15;
    });
    button.classList.toggle("is-hidden", !isStyleVisible);
    if (!isStyleVisible) return;

    const size = 30;
    const gap = 8;
    const left = rect.right + gap;
    const top = rect.top - Math.max(12, size * 0.45);
    button.style.left = `${Math.max(8, Math.min(window.innerWidth - size - 8, left))}px`;
    button.style.top = `${Math.max(8, Math.min(window.innerHeight - size - 8, top))}px`;
  });
  positionBlockPopover();
};

const scheduleInlineControlPosition = () => {
  window.cancelAnimationFrame(inlineControlFrame);
  inlineControlFrame = window.requestAnimationFrame(positionInlineControls);
};

const showBlockPopover = (group) => {
  const popover = $(".block-history-popover");
  if (!popover) return;
  popover.hidden = false;
  popover.dataset.activeGroup = group;
  positionBlockPopover();
};

const hideBlockPopover = () => {
  const popover = $(".block-history-popover");
  if (!popover) return;
  popover.hidden = true;
  delete popover.dataset.activeGroup;
};

const positionBlockPopover = () => {
  const popover = $(".block-history-popover");
  if (!popover || popover.hidden) return;
  const group = popover.dataset.activeGroup;
  const button = $(`[data-inline-edit-group="${CSS.escape(group)}"]`) || $(".background-edit-button.is-active");
  if (!button) return;
  const rect = button.getBoundingClientRect();
  const popoverRect = popover.getBoundingClientRect();
  const left = Math.min(window.innerWidth - popoverRect.width - 8, Math.max(8, rect.right + 8));
  const top = Math.min(window.innerHeight - popoverRect.height - 8, Math.max(8, rect.top));
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
};

const createEditorShell = () => {
  if (!editorAvailable || $(".editor-float")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <button class="editor-float" type="button" aria-label="Toggle edit mode" aria-pressed="false" title="Edit mode">✎</button>
    <div class="draft-bar" hidden>
      <button type="button" data-save-draft title="Save changes">✓</button>
      <button type="button" data-discard-draft title="Discard draft">×</button>
      <span>Draft active</span>
    </div>
    <div class="block-history-popover" hidden>
      <button type="button" data-block-save>Save</button>
      <button type="button" data-block-link>Link</button>
      <button type="button" data-block-back>Go back</button>
      <button type="button" data-block-forward>Go forward</button>
    </div>
    <input class="image-picker" type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.svg,image/jpeg,image/png,image/webp,image/gif,image/svg+xml" hidden />
    <div class="editor-toast" role="status" aria-live="polite"></div>
  `);
  const dock = document.createElement("div");
  dock.className = "global-editor-dock";
  dock.dataset.editorDock = "true";
  const floatButton = $(".editor-float");
  const draftBar = $(".draft-bar");
  if (floatButton && draftBar) {
    document.body.appendChild(dock);
    dock.append(floatButton, draftBar);
    draftBar.querySelector("[data-save-draft]")?.insertAdjacentHTML("afterend", `
      <button type="button" data-global-undo title="Go back">↶</button>
      <button type="button" data-global-redo title="Go forward">↷</button>
    `);
    draftBar.insertAdjacentHTML("beforeend", `<span class="editor-drag-handle" title="Drag editor controls">⋮⋮</span>`);
    makeFixedDraggable(dock);
  }
  document.body.insertAdjacentHTML("beforeend", `
    <div class="editor-context-menu" hidden>
      <button type="button" data-context-link>Link</button>
      <button type="button" data-context-replace-image hidden>Replace photo</button>
      <button type="button" data-context-edit-description hidden>Edit description</button>
      <button type="button" data-context-open-link hidden>Open link</button>
      <button type="button" data-context-remove-link hidden>Remove link</button>
    </div>
  `);
  $(".theme-toggle")?.insertAdjacentHTML("afterend", `<button class="background-edit-button" type="button" aria-label="Edit current background" title="Edit current background">✎</button>`);
  $(".editor-float").addEventListener("click", () => {
    editMode = !editMode;
    document.body.classList.toggle("is-editing", editMode);
    $(".editor-float").setAttribute("aria-pressed", String(editMode));
    $(".draft-bar").hidden = !editMode;
    scheduleInlineControlPosition();
  });
  $("[data-save-draft]").addEventListener("click", saveContent);
  $("[data-discard-draft]").addEventListener("click", discardDraft);
  $("[data-block-save]").addEventListener("click", saveActiveBlock);
  $("[data-block-link]").addEventListener("click", linkSelectionInActiveBlock);
  $("[data-block-back]").addEventListener("click", undoActiveBlock);
  $("[data-block-forward]").addEventListener("click", redoActiveBlock);
  $("[data-global-undo]")?.addEventListener("click", undoGlobalChange);
  $("[data-global-redo]")?.addEventListener("click", redoGlobalChange);
  $("[data-context-link]")?.addEventListener("click", applyContextLink);
  $("[data-context-replace-image]")?.addEventListener("click", replaceContextImage);
  $("[data-context-edit-description]")?.addEventListener("click", editContextDescription);
  $("[data-context-open-link]")?.addEventListener("click", openContextLink);
  $("[data-context-remove-link]")?.addEventListener("click", removeContextLink);
  $(".background-edit-button")?.addEventListener("click", () => {
    if (!editMode) return;
    const theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    finishInlineEdit({ silent: true });
    finishGroupEdit({ silent: true });
    activeEditable = { pathValue: `backgrounds.${theme}`, kind: "image" };
    $(".image-picker").click();
  });
  document.body.addEventListener("click", handleEditorClick);
  document.body.addEventListener("contextmenu", handleEditorContextMenu);
  document.addEventListener("click", hideEditorContextMenu);
  $(".image-picker").addEventListener("change", handleImagePicked);
};

const handleEditorClick = async (event) => {
  if (event.target.closest(".global-editor-dock, .editor-context-menu, .block-history-popover, .image-picker")) return;
  const editButton = event.target.closest("[data-inline-edit-group]");
  const addButton = event.target.closest("[data-add-card]");
  const addSkillButton = event.target.closest("[data-add-skill-category]");
  const deleteButton = event.target.closest("[data-delete-card]");
  const editableImage = event.target.closest("[data-edit-kind='image']");
  const editableField = event.target.closest("[data-edit-path]");
  const inlineLink = event.target.closest("a.inline-text-link, a.element-link-wrap, a.link-with-arrow");

  if (!editMode && (editButton || addButton || addSkillButton || deleteButton || editableImage)) return;

  if (editMode && editableImage) {
    event.preventDefault();
    event.stopPropagation();
    finishInlineEdit({ silent: true });
    pushGlobalHistory();
    activeEditable = { pathValue: editableImage.dataset.editPath, kind: "image" };
    $(".image-picker").click();
    return;
  }
  if (editMode && editableField?.dataset.editKind === "placeholder") {
    event.preventDefault();
    event.stopPropagation();
    const current = getPath(draftContent, editableField.dataset.editPath) || editableField.placeholder || "";
    const next = window.prompt("Edit placeholder text.", current);
    if (next === null) return;
    pushGlobalHistory();
    setPath(draftContent, editableField.dataset.editPath, next);
    saveDraft();
    renderContent();
    toast("Placeholder saved to draft");
    return;
  }
  if (editMode && editableField) {
    event.preventDefault();
    event.stopPropagation();
    activateInlineEdit(editableField.dataset.editPath, editableField.dataset.editKind || "text", editableField);
    return;
  }
  if (editMode && inlineLink && inlineLink.href && !inlineLink.closest("[contenteditable='true']")) return;
  if (editButton) {
    const group = editButton.dataset.inlineEditGroup;
    if (activeGroup) {
      if (activeGroup.group === group) {
        saveActiveBlock();
      } else {
        toast("Click the active block pencil again to save first.", true);
      }
      return;
    }
    const groupTargets = $$(`[data-edit-group="${CSS.escape(group)}"]`);
    const imagePath = groupTargets.find((target) => target.dataset.editImagePath)?.dataset.editImagePath;
    if (imagePath) {
      activateImageBlock(group, imagePath);
      $(".image-picker").click();
      return;
    }
    activateGroupEdit(group);
  }
  if (addButton) addCard(addButton.dataset.addCard);
  if (addSkillButton) addSkillToCategory(addSkillButton.dataset.addSkillCategory);
  if (deleteButton) deleteCard(deleteButton.dataset.deleteCard, Number(deleteButton.dataset.deleteIndex));
};

const findEditableElement = (pathValue) => $(`[data-edit-path="${CSS.escape(pathValue)}"]`);

const activateGroupEdit = (group) => {
  const containers = $$(`[data-edit-group="${CSS.escape(group)}"]`);
  const fields = containers.flatMap((container) =>
    container.matches("[data-edit-path]") ? [container] : $$("[data-edit-path]", container)
  ).filter((field) => field.dataset.editKind !== "image");

  if (fields.length === 0) return;
  const paths = getGroupPaths(group);
  activeGroup = { group, fields, paths, startSnapshot: snapshotPaths(paths) };
  containers.forEach((container) => container.classList.add("is-group-editing"));
  const activeButton = $(`[data-inline-edit-group="${CSS.escape(group)}"]`);
  activeButton?.classList.add("is-active");
  activeButton?.setAttribute("title", "Save this block");
  activeButton?.setAttribute("aria-label", "Save this block");
  showBlockPopover(group);
  fields.forEach((field) => {
    field.contentEditable = "true";
    field.classList.add("is-inline-editing");
    field.addEventListener("keydown", handleInlineKeydown);
    field.addEventListener("input", handleGroupInput);
  });
  fields[0].focus();
  scheduleInlineControlPosition();
};

const activateImageBlock = (group, pathValue) => {
  finishGroupEdit({ silent: true, commitHistory: false });
  const paths = [pathValue];
  activeGroup = { group, fields: [], paths, startSnapshot: snapshotPaths(paths), imageOnly: true };
  const activeButton = $(`[data-inline-edit-group="${CSS.escape(group)}"]`) || $(".background-edit-button");
  activeButton?.classList.add("is-active");
  showBlockPopover(group);
};

const finishGroupEdit = (options = {}) => {
  if (!activeGroup) return;
  activeGroup.fields.forEach((field) => {
    field.removeEventListener("keydown", handleInlineKeydown);
    field.removeEventListener("input", handleGroupInput);
    field.contentEditable = "false";
    field.classList.remove("is-inline-editing");
    writeEditableValue(field);
  });
  $$(`[data-edit-group="${CSS.escape(activeGroup.group)}"]`).forEach((container) => container.classList.remove("is-group-editing"));
  $(`[data-inline-edit-group="${CSS.escape(activeGroup.group)}"]`)?.classList.remove("is-active");
  $(".background-edit-button")?.classList.remove("is-active");
  hideBlockPopover();
  activeGroup = null;
  saveDraft();
  if (!options.silent) {
    renderContent();
    toast("Draft saved locally");
  }
};

const readEditableFieldValue = (field) => {
  const pathValue = field.dataset.editPath;
  const kind = field.dataset.editKind || "text";
  const clone = field.cloneNode(true);
  clone.querySelectorAll("[aria-hidden='true'], .inline-anchor, .inline-edit-icon, .inline-delete-icon, .inline-add-icon").forEach((item) => item.remove());
  let value = kind === "html"
    ? clone.innerHTML
    : clone.innerText.replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").trimEnd();
  if (kind === "list") value = toList(clone.textContent);
  if (pathValue === "about.ctaText") value = value.replace(/[↗↖↘↙↱↲↳↴➚➜→↑↓←]|â†[—’˜]/g, "").trim();
  if (pathValue === "hero.location") value = value.replace(/^#/, "").trim();
  if (pathValue === "hero.year") value = value.replace(/^@/, "").trim();
  if (kind === "list" || kind === "html") return value;
  return makeRichValue(value, richLinks(getPath(draftContent, pathValue)));
};

const handleGroupInput = () => {
  if (!activeGroup) return;
  activeGroup.fields.forEach((field) => {
    writeEditableValue(field);
  });
  saveDraft();
};

const writeEditableValue = (field) => {
  if (!field?.dataset?.editPath) return;
  if (field.dataset.editKind === "skill-category") {
    const fromCategory = field.dataset.editCategory || getPath(draftContent, field.dataset.editPath);
    const toCategory = readEditableFieldValue(field).toString().trim() || fromCategory;
    draftContent.skills.forEach((skill) => {
      if ((skill.category || "Tools") === fromCategory) skill.category = toCategory;
    });
    field.dataset.editCategory = toCategory;
    return;
  }
  setPath(draftContent, field.dataset.editPath, readEditableFieldValue(field));
};

const getSelectionField = () => {
  const selection = window.getSelection();
  if (!activeGroup || !selection || selection.rangeCount === 0) return null;
  const node = selection.anchorNode?.nodeType === Node.TEXT_NODE ? selection.anchorNode.parentElement : selection.anchorNode;
  const field = node?.closest?.("[data-edit-path]");
  if (!field || !activeGroup.fields.includes(field)) return null;
  return { selection, field };
};

const linkSelectionInActiveBlock = () => {
  const selectionInfo = getSelectionField();
  if (!selectionInfo) {
    toast("Select text inside this block first.", true);
    return;
  }

  const { selection, field } = selectionInfo;
  let selectedText = selection.toString().replace(/\s+/g, " ").trim();
  const linkElement = selection.anchorNode?.parentElement?.closest?.("a.inline-text-link");

  if (!selectedText && linkElement) selectedText = linkElement.textContent.replace(/[↗↖↘↙↱↲↳↴➚➜→↑↓←]/g, "").trim();
  if (!selectedText) {
    toast("Select the exact text you want to link.", true);
    return;
  }

  const pathValue = field.dataset.editPath;
  const currentValue = readEditableFieldValue(field);
  const text = richText(currentValue);
  const links = richLinks(getPath(draftContent, pathValue)).filter((link) => link.text !== selectedText);
  const currentUrl = richLinks(getPath(draftContent, pathValue)).find((link) => link.text === selectedText)?.url || linkElement?.getAttribute("href") || "";
  const url = window.prompt("Paste the link URL. Leave empty to remove this link.", currentUrl);
  if (url === null) return;

  if (url.trim()) links.push({ text: selectedText, url: url.trim() });
  setPath(draftContent, pathValue, makeRichValue(text, links));
  saveDraft();
  const group = activeGroup.group;
  activeGroup = null;
  renderContent();
  window.requestAnimationFrame(() => activateGroupEdit(group));
  toast(url.trim() ? "Link added to draft" : "Link removed from draft");
};

const getSelectedEditableField = () => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const node = selection.anchorNode?.nodeType === Node.TEXT_NODE ? selection.anchorNode.parentElement : selection.anchorNode;
  const field = node?.closest?.("[data-edit-path]");
  if (!field) return null;
  return { selection, field, selectedText: selection.toString().replace(/\s+/g, " ").trim() };
};

const cleanLinkedText = (value) => String(value || "").replace(/[↗↖↘↙↱↲↳↴➚➜→↑↓←]/g, "").replace(/\s+/g, " ").trim();

const getContextCurrentUrl = (target) => {
  if (!target?.pathValue) return "";
  if (target.type === "text") {
    return richLinks(getPath(draftContent, target.pathValue)).find((link) => link.text === target.selectedText)?.url
      || target.linkElement?.getAttribute("href")
      || "";
  }
  return target.field?.dataset.editKind === "url"
    ? getPath(draftContent, target.pathValue) || target.field?.getAttribute("href") || ""
    : getElementLink(target.pathValue);
};

const showEditorContextMenu = (event, target) => {
  const menu = $(".editor-context-menu");
  if (!menu) return;
  contextLinkTarget = target;
  const openButton = menu.querySelector("[data-context-open-link]");
  const removeButton = menu.querySelector("[data-context-remove-link]");
  const replaceButton = menu.querySelector("[data-context-replace-image]");
  const descriptionButton = menu.querySelector("[data-context-edit-description]");
  const currentUrl = getContextCurrentUrl(target);
  if (openButton) {
    openButton.hidden = !currentUrl;
    openButton.dataset.openUrl = currentUrl;
  }
  if (removeButton) removeButton.hidden = !currentUrl;
  if (replaceButton) replaceButton.hidden = target.field?.dataset.editKind !== "image";
  if (descriptionButton) descriptionButton.hidden = !target.field?.dataset.descriptionPath;
  menu.hidden = false;
  const rect = menu.getBoundingClientRect();
  menu.style.left = `${Math.min(window.innerWidth - rect.width - 8, Math.max(8, event.clientX))}px`;
  menu.style.top = `${Math.min(window.innerHeight - rect.height - 8, Math.max(8, event.clientY))}px`;
};

const hideEditorContextMenu = (event) => {
  if (event?.target?.closest?.(".editor-context-menu")) return;
  const menu = $(".editor-context-menu");
  if (menu) menu.hidden = true;
};

const handleEditorContextMenu = (event) => {
  if (!editMode || event.target.closest(".global-editor-dock, .editor-context-menu")) return;
  if (event.target.closest(".floating-tool")) {
    event.preventDefault();
    hideEditorContextMenu();
    return;
  }
  const selectionInfo = getSelectedEditableField();
  const linkedText = event.target.closest("a.inline-text-link");
  const urlParent = event.target.closest("[data-edit-kind='url']");
  const field = urlParent || event.target.closest("[data-edit-path]");
  const genericTarget = event.target.closest("[data-link-key], button, a, img, svg");
  if (!field && !selectionInfo && !genericTarget) return;

  event.preventDefault();
  event.stopPropagation();
  if (linkedText) {
    const linkedField = linkedText.closest("[data-edit-path]");
    if (linkedField) {
      showEditorContextMenu(event, {
        type: "text",
        field: linkedField,
        pathValue: linkedField.dataset.editPath,
        selectedText: cleanLinkedText(linkedText.textContent),
        linkElement: linkedText
      });
      return;
    }
  }
  if (selectionInfo?.selectedText) {
    showEditorContextMenu(event, {
      type: "text",
      field: selectionInfo.field,
      pathValue: selectionInfo.field.dataset.editPath,
      selectedText: selectionInfo.selectedText
    });
    return;
  }

  const genericKey = genericTarget?.dataset.linkKey || `element.${genericTarget.tagName.toLowerCase()}.${String(genericTarget.id || genericTarget.className || "target").trim().replace(/\s+/g, "-")}`;
  if (!field && genericTarget && !genericTarget.dataset.linkKey) genericTarget.dataset.linkKey = genericKey;
  showEditorContextMenu(event, {
    type: "element",
    field,
    pathValue: field?.dataset.editPath || genericKey
  });
};

const applyContextLink = () => {
  if (!contextLinkTarget?.pathValue) return;
  const snapshot = contentSnapshot();
  const currentUrl = getContextCurrentUrl(contextLinkTarget);
  const url = window.prompt("Paste the link URL. Leave empty to remove this link.", currentUrl);
  if (url === null) return;

  pushGlobalHistory(snapshot);
  updateContextLink(url.trim());
  saveDraft();
  hideEditorContextMenu();
  renderContent();
  toast(url.trim() ? "Link added to draft" : "Link removed from draft");
};

const updateContextLink = (url) => {
  if (contextLinkTarget.type === "text") {
    const field = contextLinkTarget.field;
    const currentValue = field ? readEditableFieldValue(field) : getPath(draftContent, contextLinkTarget.pathValue);
    const text = richText(currentValue);
    const links = richLinks(getPath(draftContent, contextLinkTarget.pathValue)).filter((link) => link.text !== contextLinkTarget.selectedText);
    if (url) links.push({ text: contextLinkTarget.selectedText, url });
    setPath(draftContent, contextLinkTarget.pathValue, makeRichValue(text, links));
  } else {
    if (contextLinkTarget.field?.dataset.editKind === "url") {
      setPath(draftContent, contextLinkTarget.pathValue, url || "#");
    } else {
      setElementLink(contextLinkTarget.pathValue, url);
    }
  }
};

const removeContextLink = () => {
  if (!contextLinkTarget?.pathValue || !getContextCurrentUrl(contextLinkTarget)) return;
  pushGlobalHistory();
  updateContextLink("");
  saveDraft();
  hideEditorContextMenu();
  renderContent();
  toast("Link removed from draft");
};

const replaceContextImage = () => {
  if (!contextLinkTarget?.pathValue || contextLinkTarget.field?.dataset.editKind !== "image") return;
  finishInlineEdit({ silent: true });
  finishGroupEdit({ silent: true });
  activeEditable = { pathValue: contextLinkTarget.pathValue, kind: "image" };
  hideEditorContextMenu();
  $(".image-picker").click();
};

const editContextDescription = () => {
  const pathValue = contextLinkTarget?.field?.dataset.descriptionPath;
  if (!pathValue) return;
  const current = richText(getPath(draftContent, pathValue));
  const next = window.prompt("Edit skill description.", current);
  if (next === null) return;
  pushGlobalHistory();
  setPath(draftContent, pathValue, next);
  saveDraft();
  hideEditorContextMenu();
  renderContent();
  toast("Description saved to draft");
};

const openContextLink = (event) => {
  const url = event.currentTarget.dataset.openUrl;
  if (url) window.open(url, "_blank", "noopener,noreferrer");
  hideEditorContextMenu();
};

const captureActiveFields = () => {
  if (!activeGroup) return;
  if (activeGroup.group?.startsWith("skills-")) return;
  activeGroup.fields.forEach((field) => {
    setPath(draftContent, field.dataset.editPath, readEditableFieldValue(field));
  });
};

const saveActiveBlock = () => {
  if (!activeGroup) return;
  captureActiveFields();
  const currentSnapshot = snapshotPaths(activeGroup.paths);
  const detachedLinks = activeGroup.paths.flatMap((pathValue) => {
    const value = getPath(draftContent, pathValue);
    const text = richText(value);
    return richLinks(value).filter((link) => link.text && !text.includes(link.text));
  });
  const history = ensureHistory(activeGroup.group);
  if (!snapshotsEqual(activeGroup.startSnapshot, currentSnapshot)) {
    history.past.push(activeGroup.startSnapshot);
    history.future = [];
    saveBlockHistories();
  }
  finishGroupEdit({ silent: true });
  renderContent();
  toast(detachedLinks.length > 0 ? "Block saved, but one link is not attached to visible text." : "Block saved to draft", detachedLinks.length > 0);
};

const undoActiveBlock = () => {
  if (!activeGroup) return;
  captureActiveFields();
  const history = ensureHistory(activeGroup.group);
  if (history.past.length === 0) {
    toast("No earlier version for this block.", true);
    return;
  }
  history.future.push(snapshotPaths(activeGroup.paths));
  const previous = history.past.pop();
  applySnapshot(previous);
  activeGroup.startSnapshot = snapshotPaths(activeGroup.paths);
  saveBlockHistories();
  saveDraft();
  renderContent();
  window.requestAnimationFrame(() => activateGroupAfterHistory(activeGroup?.group, previous));
};

const redoActiveBlock = () => {
  if (!activeGroup) return;
  captureActiveFields();
  const history = ensureHistory(activeGroup.group);
  if (history.future.length === 0) {
    toast("No forward version for this block.", true);
    return;
  }
  history.past.push(snapshotPaths(activeGroup.paths));
  const next = history.future.pop();
  applySnapshot(next);
  activeGroup.startSnapshot = snapshotPaths(activeGroup.paths);
  saveBlockHistories();
  saveDraft();
  renderContent();
  window.requestAnimationFrame(() => activateGroupAfterHistory(activeGroup?.group, next));
};

const undoGlobalChange = () => {
  finishInlineEdit({ silent: true });
  finishGroupEdit({ silent: true });
  if (globalHistory.past.length === 0) {
    toast("No earlier edit.", true);
    return;
  }
  globalHistory.future.push(contentSnapshot());
  globalHistory.future = globalHistory.future.slice(-10);
  draftContent = mergeContent(globalHistory.past.pop());
  saveGlobalHistory();
  saveDraft();
  renderContent();
  toast("Went back one edit");
};

const redoGlobalChange = () => {
  finishInlineEdit({ silent: true });
  finishGroupEdit({ silent: true });
  if (globalHistory.future.length === 0) {
    toast("No forward edit.", true);
    return;
  }
  globalHistory.past.push(contentSnapshot());
  globalHistory.past = globalHistory.past.slice(-10);
  draftContent = mergeContent(globalHistory.future.pop());
  saveGlobalHistory();
  saveDraft();
  renderContent();
  toast("Went forward one edit");
};

const activateGroupAfterHistory = (group) => {
  if (!group) return;
  activeGroup = null;
  if (group === "hero-image" || group.startsWith("background-")) {
    const pathValue = getGroupPaths(group)[0];
    activateImageBlock(group, pathValue);
    return;
  }
  activateGroupEdit(group);
};

const activateInlineEdit = (pathValue, kind, targetElement = null) => {
  const element = targetElement || findEditableElement(pathValue);
  if (!element) return;
  if (activeEditable?.element && activeEditable.element !== element) finishInlineEdit();
  if (!activeEditable || activeEditable.element !== element) pushGlobalHistory();
  activeEditable = { element, pathValue, kind };
  element.classList.add("is-inline-editing");
  if (pathValue === "hero.title") element.textContent = richText(getPath(draftContent, pathValue));
  if (kind !== "image") element.contentEditable = "true";
  element.focus();
  if (!element.dataset.inlineEditBound) {
    element.dataset.inlineEditBound = "true";
    element.addEventListener("input", handleInlineInput);
  }
  element.removeEventListener("keydown", handleInlineKeydown);
  element.addEventListener("keydown", handleInlineKeydown);
};

const handleInlineKeydown = (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    activeGroup = null;
    activeEditable = null;
    renderContent();
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const newline = document.createTextNode("\n");
    range.insertNode(newline);
    range.setStartAfter(newline);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    if (activeGroup?.fields?.includes(event.currentTarget)) {
      handleGroupInput();
    } else {
      handleInlineInput({ currentTarget: event.currentTarget });
    }
  }
};

const handleInlineInput = (event) => {
  if (!activeEditable?.element || event.currentTarget !== activeEditable.element) return;
  writeEditableValue(activeEditable.element);
  saveDraft();
};

const finishInlineEdit = (options = {}) => {
  if (!activeEditable?.element) return;
  const { element } = activeEditable;
  element.removeEventListener("keydown", handleInlineKeydown);
  element.contentEditable = "false";
  element.classList.remove("is-inline-editing");
  writeEditableValue(element);
  saveDraft();
  activeEditable = null;
  if (options.silent) return;
  renderContent();
  toast("Draft saved locally");
};

const handleImagePicked = async (event) => {
  const file = event.target.files?.[0];
  event.target.value = "";
  const pathValue = activeEditable?.pathValue || activeGroup?.paths?.[0];
  if (!file || !pathValue) return;
  if (file.size > 5 * 1024 * 1024) {
    toast("Image must be 5MB or smaller.", true);
    return;
  }
  const form = new FormData();
  form.append("image", file);
  try {
    const response = await fetch("/api/upload", { method: "POST", body: form });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Upload failed.");
    pushGlobalHistory();
    setPath(draftContent, pathValue, result.path);
    saveDraft();
    renderContent();
    if (activeGroup?.imageOnly) window.requestAnimationFrame(() => activateImageBlock(activeGroup.group, pathValue));
    activeEditable = null;
    toast("Image draft saved locally");
  } catch (error) {
    toast(error.message, true);
  }
};

const blankItem = {
  project: { title: "New project", category: "Category", shortDescription: "Short description", longDescription: "Long description", techStack: ["Tool"], githubLink: "#", liveDemoLink: "#", image: "", whatILearned: "What I learned." },
  skill: { name: "New skill", category: "Tools", description: "Description", icon: "" },
  learning: { title: "New learning item", type: "currently learning", provider: "Provider", status: "In progress", link: "#", description: "Description", image: "" },
  note: { title: "New note", category: "Research", summary: "Summary", content: "Full note content.", tags: ["Tag"], date: new Date().toISOString().slice(0, 10), readingTime: "2 min" }
};

const collectionMap = { project: "projects", skill: "skills", learning: "learning", note: "notes" };
const addCard = (type) => {
  const collection = collectionMap[type];
  if (!collection) return;
  pushGlobalHistory();
  draftContent[collection].push(structuredClone(blankItem[type]));
  saveDraft();
  renderContent();
  toast("New card added to draft");
};

const addSkillToCategory = (category) => {
  pushGlobalHistory();
  draftContent.skills.push({
    name: "New skill",
    category,
    description: "Description",
    icon: ""
  });
  saveDraft();
  renderContent();
  toast(`New ${category} tool added to draft`);
};

const deleteCard = (type, index) => {
  const collection = collectionMap[type];
  if (!collection || !window.confirm(`Delete this ${type}?`)) return;
  pushGlobalHistory();
  draftContent[collection].splice(index, 1);
  saveDraft();
  activeGroup = null;
  activeEditable = null;
  renderContent();
  toast("Card removed from draft");
};

const saveContent = async () => {
  finishGroupEdit();
  finishInlineEdit();
  try {
    const response = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftContent)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Save failed.");
    savedContent = structuredClone(draftContent);
    localStorage.removeItem(draftKey);
    globalHistory = { past: [], future: [] };
    localStorage.removeItem(globalHistoryKey);
    toast("Saved to content/site.json");
  } catch (error) {
    toast(error.message, true);
  }
};

const discardDraft = () => {
  if (!window.confirm("Discard all local draft edits?")) return;
  activeGroup = null;
  activeEditable = null;
  draftContent = structuredClone(savedContent);
  localStorage.removeItem(draftKey);
  globalHistory = { past: [], future: [] };
  localStorage.removeItem(globalHistoryKey);
  renderContent();
  toast("Draft discarded");
};

const toast = (message, isError = false) => {
  const element = $(".editor-toast");
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("is-error", isError);
  element.classList.add("is-visible");
  window.setTimeout(() => element.classList.remove("is-visible"), 2400);
};

const getPreferredTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  $(".theme-toggle")?.setAttribute("aria-pressed", String(theme === "dark"));
};

const setupAnimationState = () => {
  phaseWords = [];
  const phaseThreeText = $(".phase-three-text");
  if (phaseThreeText) {
    const sourceText = phaseThreeText.dataset.fillText || phaseThreeText.textContent || "";
    const words = sourceText.trim().split(/\s+/).filter(Boolean);
    phaseThreeText.textContent = "";
    words.forEach((word, index) => {
      const wordElement = document.createElement("span");
      wordElement.className = "phase-word";
      wordElement.textContent = word;
      wordElement.style.setProperty("--word-fill", "0");
      phaseThreeText.appendChild(wordElement);
      phaseWords.push(wordElement);
      if (index < words.length - 1) phaseThreeText.appendChild(document.createTextNode(" "));
    });
    setEditable(phaseThreeText, "approach.text", "long");
  }
  stackRows = $$(".stack-grid h3").map((heading, index) => {
    const tools = heading.nextElementSibling?.classList.contains("stack-tools") ? heading.nextElementSibling : null;
    tools?.querySelectorAll(".stack-tool").forEach((tool, toolIndex) => {
      tool.style.setProperty("--stack-delay", toolIndex);
      tool.style.setProperty("--stack-row-delay", index * 120);
    });
    heading.style.setProperty("--stack-row-delay", index * 120);
    return { heading, tools };
  });
  updatePhaseThreeHeight();
  updatePhaseThree();
  updateStackRows();
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (start, end, amount) => start + (end - start) * amount;
const getPhaseThreeTiming = () => ({
  introHold: Math.min(300, window.innerHeight * 0.28),
  outroHold: Math.min(240, window.innerHeight * 0.24),
  scrollPerWord: clamp(window.innerHeight * 0.06, 42, 68)
});

const updatePhaseTwo = () => {
  const phaseTwo = $(".phase-two");
  const flipCard = $(".flip-card");
  if (!phaseTwo || window.matchMedia("(max-width: 920px)").matches) {
    flipCard?.classList.remove("is-scroll-morph");
    return;
  }
  const phaseStart = phaseTwo.offsetTop - window.innerHeight * 0.22;
  const phaseTravel = phaseTwo.offsetHeight - window.innerHeight * 0.52;
  const progress = clamp((window.scrollY - phaseStart) / Math.max(phaseTravel, 1), 0, 1);
  phaseTwo.style.setProperty("--phase", (1 - Math.pow(1 - progress, 3)).toFixed(4));
  updateMorphingCard();
};

const updateScrollProgress = () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) : 0;
  document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(4));
};

const updatePhaseThreeHeight = () => {
  const phaseThree = $(".phase-three");
  if (!phaseThree || phaseWords.length === 0) return;
  const { introHold, outroHold, scrollPerWord } = getPhaseThreeTiming();
  phaseThree.style.setProperty("--phase-three-height", `${Math.round(window.innerHeight + introHold + outroHold + phaseWords.length * scrollPerWord)}px`);
};

const updatePhaseThree = () => {
  const phaseThree = $(".phase-three");
  if (!phaseThree || phaseWords.length === 0) return;
  const { introHold, scrollPerWord } = getPhaseThreeTiming();
  const start = phaseThree.offsetTop + introHold;
  const fillHead = clamp((window.scrollY - start) / Math.max(phaseWords.length * scrollPerWord, 1), 0, 1) * phaseWords.length;
  phaseWords.forEach((word, index) => word.style.setProperty("--word-fill", clamp(fillHead - index, 0, 1).toFixed(3)));
};

const updateStackRows = () => {
  const stackSection = $(".stack-section");
  if (!stackSection || stackRows.length === 0) return;
  const rect = stackSection.getBoundingClientRect();
  const isInPhase = rect.top <= window.innerHeight * 0.92 && rect.bottom >= window.innerHeight * 0.36;
  stackRows.forEach(({ heading, tools }) => {
    if (isInPhase) {
      heading.classList.add("is-visible");
      tools?.classList.add("is-visible");
    } else if (rect.top > window.innerHeight * 0.98) {
      heading.classList.remove("is-visible");
      tools?.classList.remove("is-visible");
    }
  });
};

const updateMorphingCard = () => {
  const flipCard = $(".flip-card");
  const phaseTwo = $(".phase-two");
  if (!flipCard || !phaseTwo) return;
  const startWidth = 200;
  const startHeight = 228;
  const startLeft = (window.innerWidth - startWidth) / 2;
  const startTop = window.innerHeight - startHeight - 20;
  const endWidth = Math.min(500, window.innerWidth * 0.28);
  const endHeight = Math.min(570, window.innerHeight * 0.63);
  const endLeft = (window.innerWidth - endWidth) / 2;
  const endTop = Math.max(130, (window.innerHeight - endHeight) / 2 + 26);
  const holdEnd = phaseTwo.offsetTop + phaseTwo.offsetHeight - endTop - endHeight - 80;
  const exitDistance = Math.max(0, window.scrollY - holdEnd);
  const progress = clamp(window.scrollY / Math.max(phaseTwo.offsetTop + phaseTwo.offsetHeight - window.innerHeight * 1.28, 1), 0, 1);
  if (window.scrollY > holdEnd + endTop + endHeight + 120) {
    flipCard.classList.remove("is-scroll-morph");
    ["--morph-left", "--morph-top", "--morph-width", "--morph-height", "--morph-rotate", "--morph-tilt", "--morph-opacity"].forEach((prop) => flipCard.style.removeProperty(prop));
    return;
  }
  const bridgeEase = 1 - Math.pow(1 - progress, 4);
  const narrow = Math.sin(Math.PI * progress) * 0.42;
  const width = lerp(startWidth, endWidth, bridgeEase) * (1 - narrow);
  const height = lerp(startHeight, endHeight, bridgeEase);
  flipCard.classList.add("is-scroll-morph");
  flipCard.style.setProperty("--morph-left", `${lerp(startLeft, endLeft + (endWidth - width) / 2, bridgeEase)}px`);
  flipCard.style.setProperty("--morph-top", `${lerp(startTop, endTop, bridgeEase) - exitDistance}px`);
  flipCard.style.setProperty("--morph-width", `${width}px`);
  flipCard.style.setProperty("--morph-height", `${height}px`);
  flipCard.style.setProperty("--morph-rotate", `${Math.max(Math.round(clamp(progress * 2.2, 0, 1) * 180), flipCard.classList.contains("is-flipped") ? 180 : 0)}deg`);
  flipCard.style.setProperty("--morph-tilt", `${Math.round((1 - bridgeEase) * 4)}deg`);
  flipCard.style.setProperty("--morph-opacity", "1");
};

const makeDraggable = (tool) => {
  let offsetX = 0;
  let offsetY = 0;
  let startX = 0;
  let startY = 0;
  let hasMoved = false;
  const moveTool = (event) => {
    const parentRect = tool.offsetParent.getBoundingClientRect();
    const edgeFreedom = tool.offsetWidth * 2;
    tool.style.left = `${Math.max(-edgeFreedom, Math.min(event.clientX - parentRect.left - offsetX, parentRect.width - tool.offsetWidth + edgeFreedom))}px`;
    tool.style.top = `${Math.max(-edgeFreedom, Math.min(event.clientY - parentRect.top - offsetY, parentRect.height - tool.offsetHeight + edgeFreedom))}px`;
    tool.style.right = "auto";
  };
  tool.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    const rect = tool.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    startX = event.clientX;
    startY = event.clientY;
    hasMoved = false;
    tool.classList.add("is-dragging");
    tool.setPointerCapture(event.pointerId);
  });
  tool.addEventListener("pointermove", (event) => {
    if (!tool.classList.contains("is-dragging")) return;
    if (!hasMoved && Math.hypot(event.clientX - startX, event.clientY - startY) < 4) return;
    hasMoved = true;
    moveTool(event);
  });
  tool.addEventListener("pointerup", (event) => {
    tool.classList.remove("is-dragging");
    tool.releasePointerCapture(event.pointerId);
  });
};

const makeFixedDraggable = (tool) => {
  let offsetX = 0;
  let offsetY = 0;
  let moved = false;

  const moveTool = (event) => {
    moved = true;
    tool.style.left = `${Math.max(8, Math.min(window.innerWidth - tool.offsetWidth - 8, event.clientX - offsetX))}px`;
    tool.style.top = `${Math.max(8, Math.min(window.innerHeight - tool.offsetHeight - 8, event.clientY - offsetY))}px`;
    tool.style.right = "auto";
    tool.style.bottom = "auto";
  };

  tool.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button, a, input, textarea, [contenteditable='true']")) return;
    const rect = tool.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    moved = false;
    tool.classList.add("is-dragging");
    tool.setPointerCapture(event.pointerId);
  });

  tool.addEventListener("pointermove", (event) => {
    if (!tool.classList.contains("is-dragging")) return;
    moveTool(event);
  });

  tool.addEventListener("pointerup", (event) => {
    tool.classList.remove("is-dragging");
    if (tool.hasPointerCapture(event.pointerId)) tool.releasePointerCapture(event.pointerId);
    if (moved) event.preventDefault();
  });
};

const setupInteractions = () => {
  $(".flip-card")?.addEventListener("click", () => {
    if (editMode) return;
    $(".flip-card")?.classList.toggle("is-flipped");
  });
  $(".menu-button")?.addEventListener("click", () => {
    const topPill = $(".top-pill");
    const isOpen = topPill?.classList.toggle("is-menu-open");
    document.body.classList.toggle("menu-open", Boolean(isOpen));
    $(".menu-button")?.setAttribute("aria-expanded", String(Boolean(isOpen)));
  });
  $$(".menu-panel a").forEach((link) => link.addEventListener("click", () => {
    $(".top-pill")?.classList.remove("is-menu-open");
    document.body.classList.remove("menu-open");
    $(".menu-button")?.setAttribute("aria-expanded", "false");
  }));
  $(".theme-toggle")?.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  });
  $(".contact-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const submitButton = $(".contact-form button");
    if (!submitButton) return;
    const label = submitButton.textContent;
    submitButton.textContent = "Submitted";
    window.setTimeout(() => { submitButton.textContent = label; }, 1800);
  });
  $$(".floating-tool").forEach(makeDraggable);
  document.addEventListener("click", () => {});
};

window.addEventListener("scroll", () => {
  updatePhaseTwo();
  updateScrollProgress();
  updatePhaseThree();
  updateStackRows();
  scheduleInlineControlPosition();
}, { passive: true });

window.addEventListener("resize", () => {
  updatePhaseTwo();
  updateScrollProgress();
  updatePhaseThreeHeight();
  updatePhaseThree();
  updateStackRows();
  scheduleInlineControlPosition();
});

(async () => {
  setTheme(getPreferredTheme());
  await loadContent();
  await checkEditor();
  createEditorShell();
  renderContent();
  setupInteractions();
  updatePhaseTwo();
  updateScrollProgress();
})();
