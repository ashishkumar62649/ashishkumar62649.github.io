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
  editorAvailable ? `<button class="inline-delete-icon" type="button" data-delete-card="${type}" data-delete-index="${index}" aria-label="Delete" title="Delete">&times;</button>` : "";

const addIcon = (type) =>
  editorAvailable ? `<button class="inline-add-icon" type="button" data-add-card="${type}" aria-label="Add ${type}" title="Add ${type}">+</button>` : "";

const socialDeleteIcon = (index) =>
  editorAvailable ? `<button class="inline-delete-icon social-delete-icon" type="button" data-delete-social-link="${index}" aria-label="Delete social link" title="Delete">&times;</button>` : "";

const socialAddIcon = () =>
  editorAvailable ? `<button class="inline-add-icon social-add-icon" type="button" data-add-social-link aria-label="Add social link" title="Add social link">+</button>` : "";

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
        <div class="stack-tool editable-card" data-layout-key="skill.${index}">
          ${skill.icon ? `<img src="${escapeHtml(skill.icon)}" alt="" data-edit-path="skills.${index}.icon" data-edit-kind="image" />` : `<span class="skill-icon-placeholder" data-edit-path="skills.${index}.icon" data-edit-kind="image"></span>`}
          <span data-edit-path="skills.${index}.name" data-description-path="skills.${index}.description" title="${escapeHtml(richText(skill.description))}">${renderLinkedText(skill.name)}</span>
          ${deleteIcon("skill", index)}
        </div>
      `).join("")}
      <button class="category-add-tool" type="button" data-add-skill-category="${escapeHtml(category)}" aria-label="Add tool to ${escapeHtml(category)}" title="Add tool">+</button>
    </div>
  `).join("");
  list.insertAdjacentHTML("beforeend", editorAvailable ? `<button class="stack-category-add" type="button" data-add-skill-category-root aria-label="Add stack category" title="Add stack category">+ Category</button><span></span>` : "");
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
      <span class="social-link-item editable-card" data-layout-key="contact.socialLinks.${index}">
        <a href="${escapeHtml(item.url || "#")}" aria-label="${escapeHtml(item.label || "Social link")}" class="social-link-arrow" data-edit-path="contact.socialLinks.${index}.url" data-edit-kind="url">
          <span class="social-icon-slot" data-edit-path="contact.socialLinks.${index}.icon" data-edit-kind="image" title="Replace icon">
            ${item.icon ? `<img src="${escapeHtml(item.icon)}" alt="" />` : `<span>${escapeHtml((item.label || "?").slice(0, 1))}</span>`}
          </span>
        </a>
        ${socialDeleteIcon(index)}
      </span>
    `).join("") + socialAddIcon();
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
  assignLayoutKeys();
  applyElementLinks();
  setupAnimationState();
  applyLayoutTransforms();
};

