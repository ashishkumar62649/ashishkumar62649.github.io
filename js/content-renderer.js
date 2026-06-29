const renderTitle = (title) => {
  const lines = richText(title || "Student Developer")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const heroTitle = $("[data-hero-title]");
  if (!heroTitle) return;
  heroTitle.setAttribute("aria-label", lines.join(" "));
  heroTitle.innerHTML = lines.map((line) => `<span class="title-line">${escapeHtml(line.toUpperCase())}</span>`).join("");
};

const renderNavigation = () => {
  const panel = $(".menu-panel");
  if (!panel) return;
  panel.innerHTML = normalizeArray(siteContent.navigation).map((link) =>
    `<a href="${escapeHtml(link.url || "#")}">${renderLinkedText(link.text)}</a>`
  ).join("");
};

const classicSectionUrl = (url = "#") => {
  const map = {
    "#home": "#classic-home",
    "#about": "#classic-about",
    "#skills": "#classic-skills",
    "#projects": "#classic-projects",
    "#learning": "#classic-learning",
    "#notes": "#classic-notes",
    "#contact": "#classic-contact"
  };
  return map[url] || url;
};

const renderClassicNavigation = () => {
  const nav = $("[data-classic-nav]");
  if (!nav) return;
  nav.innerHTML = normalizeArray(siteContent.navigation).map((link) =>
    `<a href="${escapeHtml(classicSectionUrl(link.url || "#"))}">${renderLinkedText(link.text)}</a>`
  ).join("");
};

const renderApproachText = (value) => {
  const element = $(".phase-three-text");
  if (!element) return;
  element.dataset.fillText = richText(value || defaultContent.approach.text);
  element.textContent = element.dataset.fillText;
};

const renderProjects = () => {
  const list = $("[data-projects-list]");
  if (!list) return;
  list.innerHTML = siteContent.projects.map((project) => `
    <article class="project-card">
      ${project.image ? `<div><img src="${escapeHtml(project.image)}" alt="" /></div>` : `<div class="project-image-placeholder"></div>`}
      <div>
        <p>${renderLinkedText(project.category)}</p>
        <h3>${renderLinkedText(project.title)}</h3>
        <p>${renderLinkedText(project.shortDescription)}</p>
        <p>${renderLinkedText(project.longDescription)}</p>
        <div class="tag-row">${toList(project.techStack).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        <p class="learned">${renderLinkedText(project.whatILearned)}</p>
        <div class="inline-links">
          ${project.githubLink && project.githubLink !== "#" ? `<a class="link-with-arrow" href="${escapeHtml(project.githubLink)}">GitHub ${linkArrow}</a>` : ""}
          ${project.liveDemoLink && project.liveDemoLink !== "#" ? `<a class="link-with-arrow" href="${escapeHtml(project.liveDemoLink)}">Live demo ${linkArrow}</a>` : ""}
        </div>
      </div>
    </article>
  `).join("") || `<p class="empty-state">Selected projects will appear here.</p>`;
};

const groupSkills = () => siteContent.skills.reduce((groups, skill) => {
  const category = skill.category || "Tools";
  groups[category] = groups[category] || [];
  groups[category].push(skill);
  return groups;
}, {});

const renderSkills = () => {
  const list = $("[data-skills-list]");
  if (!list) return;
  const groups = groupSkills();
  list.innerHTML = Object.entries(groups).map(([category, rows]) => `
    <h3>${escapeHtml(category)}</h3>
    <div class="stack-tools">
      ${rows.map((skill) => `
        <div class="stack-tool">
          ${skill.icon ? `<img src="${escapeHtml(skill.icon)}" alt="" />` : `<span class="skill-icon-placeholder"></span>`}
          <span title="${escapeHtml(richText(skill.description))}">${renderLinkedText(skill.name)}</span>
        </div>
      `).join("")}
    </div>
  `).join("");
};

const renderLearning = () => {
  const list = $("[data-learning-list]");
  if (!list) return;
  list.innerHTML = siteContent.learning.map((item) => `
    <article class="learning-item">
      ${item.image ? `<div><img src="${escapeHtml(item.image)}" alt="" /></div>` : ""}
      <div>
        <p><span>${renderLinkedText(item.type)}</span> / <span>${renderLinkedText(item.status)}</span></p>
        <h3>${renderLinkedText(item.title)}</h3>
        <p>${renderLinkedText(item.description)}</p>
        <span>${renderLinkedText(item.provider)}</span>
      </div>
      ${item.link && item.link !== "#" ? `<a class="link-with-arrow" href="${escapeHtml(item.link)}">Open ${linkArrow}</a>` : ""}
    </article>
  `).join("") || `<p class="empty-state">Learning items will appear here.</p>`;
};

const renderNotes = () => {
  const list = $("[data-notes-list]");
  if (!list) return;
  list.innerHTML = siteContent.notes.map((note) => `
    <article class="note-card">
      <p><span>${renderLinkedText(note.category)}</span> / <span>${renderLinkedText(note.date)}</span> / <span>${renderLinkedText(note.readingTime)}</span></p>
      <h3>${renderLinkedText(note.title)}</h3>
      <p>${renderLinkedText(note.summary)}</p>
      <div class="tag-row">${toList(note.tags).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
      <details>
        <summary>Read note</summary>
        <p>${renderLinkedText(note.content)}</p>
      </details>
    </article>
  `).join("") || `<p class="empty-state">Research notes will appear here.</p>`;
};

const renderClassicSkills = () => {
  const list = $("[data-classic-skills]");
  if (!list) return;
  const groups = groupSkills();
  list.innerHTML = Object.entries(groups).map(([category, rows]) => `
    <div class="classic-skill-group">
      <h3>${escapeHtml(category)}</h3>
      <div>
        ${rows.map((skill) => `<span title="${escapeHtml(richText(skill.description))}">${renderLinkedText(skill.name)}</span>`).join("")}
      </div>
    </div>
  `).join("");
};

const renderClassicProjects = () => {
  const list = $("[data-classic-projects]");
  if (!list) return;
  list.innerHTML = siteContent.projects.map((project) => `
    <article class="classic-project">
      <p>${renderLinkedText(project.category)}</p>
      <h3>${renderLinkedText(project.title)}</h3>
      <p>${renderLinkedText(project.shortDescription)}</p>
      <p>${renderLinkedText(project.longDescription)}</p>
      <div class="classic-tags">${toList(project.techStack).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
    </article>
  `).join("") || `<p class="empty-state">Selected projects will appear here.</p>`;
};

const renderClassicLearning = () => {
  const list = $("[data-classic-learning]");
  if (!list) return;
  list.innerHTML = siteContent.learning.map((item) => `
    <article class="classic-simple-item">
      <p>${renderLinkedText(item.type)} / ${renderLinkedText(item.status)}</p>
      <h3>${renderLinkedText(item.title)}</h3>
      <p>${renderLinkedText(item.description)}</p>
      <p>${renderLinkedText(item.provider)}</p>
    </article>
  `).join("") || `<p class="empty-state">Learning items will appear here.</p>`;
};

const renderClassicNotes = () => {
  const list = $("[data-classic-notes]");
  if (!list) return;
  list.innerHTML = siteContent.notes.map((note) => `
    <article class="classic-simple-item">
      <p>${renderLinkedText(note.category)} / ${renderLinkedText(note.date)} / ${renderLinkedText(note.readingTime)}</p>
      <h3>${renderLinkedText(note.title)}</h3>
      <p>${renderLinkedText(note.summary)}</p>
      <div class="classic-tags">${toList(note.tags).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
    </article>
  `).join("") || `<p class="empty-state">Research notes will appear here.</p>`;
};

const renderClassicContent = () => {
  setText("[data-classic-name]", siteContent.hero.name || "Ashish Kumar");
  setHtml("[data-classic-identity]", siteContent.hero.identity);
  setHtml("[data-classic-title]", richText(siteContent.hero.title || "Student Developer").replace(/\n+/g, " "));
  setHtml("[data-classic-subtitle]", siteContent.hero.subtitle || siteContent.approach.text);
  setText("[data-classic-location]", siteContent.hero.location);
  setHtml("[data-classic-about-heading]", siteContent.about.heading);
  setHtml("[data-classic-about-intro]", siteContent.about.intro);
  setHtml("[data-classic-about-secondary]", siteContent.about.secondary);
  setHtml("[data-classic-about-status]", siteContent.about.status);
  setHtml("[data-classic-projects-heading]", siteContent.sectionLabels.projectsHeading);
  setHtml("[data-classic-learning-heading]", siteContent.sectionLabels.learningHeading);
  setHtml("[data-classic-notes-heading]", siteContent.sectionLabels.notesHeading);
  setHtml("[data-classic-contact-heading]", siteContent.contact.heading);
  setHtml("[data-classic-contact-text]", siteContent.contact.text);

  const actions = $("[data-classic-actions]");
  if (actions) {
    actions.innerHTML = normalizeArray(siteContent.hero.buttons).map((button) =>
      `<a href="${escapeHtml(classicSectionUrl(button.url || "#"))}">${renderLinkedText(button.text)}</a>`
    ).join("");
  }

  const email = $("[data-classic-email]");
  if (email) {
    email.textContent = siteContent.contact.email || "";
    email.href = `mailto:${siteContent.contact.email || ""}`;
  }

  renderClassicNavigation();
  renderClassicSkills();
  renderClassicProjects();
  renderClassicLearning();
  renderClassicNotes();
};

const renderContact = () => {
  setHtml("[data-contact-heading]", siteContent.contact.heading);
  setHtml("[data-contact-text]", siteContent.contact.text);
  const button = $("[data-contact-button]");
  if (button) button.textContent = siteContent.contact.buttonText || "Submit";

  const formLabelMap = [
    [".contact-form label:nth-child(1) span", siteContent.contact.formLabels.name],
    [".contact-form label:nth-child(2) span", siteContent.contact.formLabels.email],
    [".contact-form label:nth-child(3) span", siteContent.contact.formLabels.project]
  ];
  formLabelMap.forEach(([selector, value]) => setText(selector, value));

  const nameInput = $('.contact-form input[name="name"]');
  const emailInput = $('.contact-form input[name="email"]');
  const projectInput = $('.contact-form textarea[name="project"]');
  if (nameInput) nameInput.placeholder = siteContent.contact.formPlaceholders.name;
  if (emailInput) emailInput.placeholder = siteContent.contact.formPlaceholders.email;
  if (projectInput) projectInput.placeholder = siteContent.contact.formPlaceholders.project;

  const socialLinks = $("[data-social-links]");
  if (socialLinks) {
    socialLinks.innerHTML = normalizeArray(siteContent.contact.socialLinks).map((item) => `
      <span class="social-link-item">
        <a href="${escapeHtml(item.url || "#")}" aria-label="${escapeHtml(item.label || "Social link")}" class="social-link-arrow">
          <span class="social-icon-slot">
            ${item.icon ? `<img src="${escapeHtml(item.icon)}" alt="" />` : `<span>${escapeHtml((item.label || "?").slice(0, 1))}</span>`}
          </span>
        </a>
      </span>
    `).join("");
  }

  const footerEmail = $("[data-footer-email]");
  if (footerEmail) {
    footerEmail.textContent = siteContent.contact.email || "";
    footerEmail.href = `mailto:${siteContent.contact.email || ""}`;
  }
};

const renderFooter = () => {
  const footerHeading = $(".footer-heading h2");
  if (footerHeading) footerHeading.innerHTML = siteContent.footer.text || "";
  setText("[data-footer-name]", siteContent.footer.copyrightText);
  setText(".footer-links h3", siteContent.footer.quickLinksHeading);
  setText(".footer-contact h3", siteContent.footer.contactHeading);
  const links = $(".footer-link-list");
  if (links) {
    links.innerHTML = normalizeArray(siteContent.footer.quickLinks)
      .map((link) => `<a class="link-with-arrow" href="${escapeHtml(link.url)}">${renderLinkedText(link.text)} ${linkArrow}</a>`)
      .join("");
  }
};

const renderContent = () => {
  document.documentElement.style.setProperty("--light-background-image", siteContent.backgrounds.light ? `url("${siteContent.backgrounds.light}")` : "none");
  document.documentElement.style.setProperty("--dark-background-image", `url("${siteContent.backgrounds.dark || "./assets/dark-globe-wallpaper.jpg"}")`);
  document.title = siteContent.meta.siteTitle || defaultContent.meta.siteTitle;
  const description = $('meta[name="description"]');
  if (description) description.content = siteContent.meta.description || defaultContent.meta.description;

  renderNavigation();
  renderClassicContent();
  setText("[data-site-brand]", richText(siteContent.hero.name || "Ashish").split(" ")[0]);
  renderTitle(siteContent.hero.title);
  setText(".stack-kicker span", siteContent.sectionLabels.stackSymbol);
  setText(".stack-kicker p", siteContent.sectionLabels.stackTitle);

  const starTool = $(".tool-star img");
  const lightningTool = $(".tool-lightning img");
  if (starTool) starTool.src = siteContent.hero.decorations.star || defaultContent.hero.decorations.star;
  if (lightningTool) lightningTool.src = siteContent.hero.decorations.lightning || defaultContent.hero.decorations.lightning;

  setText("[data-hero-location]", `#${siteContent.hero.location || ""}`);
  setText("[data-hero-year]", `@${siteContent.hero.year || "2018"}`);
  $("[data-hero-image]")?.setAttribute("src", siteContent.hero.image || "./assets/portrait.jpg");
  $("[data-hero-image-back]")?.setAttribute("src", siteContent.hero.image || "./assets/portrait.jpg");

  setHtml("[data-about-heading]", siteContent.about.heading);
  setHtml("[data-about-intro]", siteContent.about.intro);
  setHtml("[data-about-secondary]", siteContent.about.secondary);
  setHtml("[data-about-status]", siteContent.about.status);

  const cta = $("[data-about-cta]");
  if (cta) {
    cta.classList.add("link-with-arrow");
    cta.innerHTML = `${renderLinkedText(siteContent.about.ctaText || "Get Started")} ${linkArrow}`;
    setHref(cta, siteContent.about.ctaLink);
  }

  renderApproachText(siteContent.approach.text);
  setHtml("[data-projects-kicker]", siteContent.sectionLabels.projectsKicker);
  setHtml("[data-projects-heading]", siteContent.sectionLabels.projectsHeading);
  setHtml("[data-learning-kicker]", siteContent.sectionLabels.learningKicker);
  setHtml("[data-learning-heading]", siteContent.sectionLabels.learningHeading);
  setHtml("[data-notes-kicker]", siteContent.sectionLabels.notesKicker);
  setHtml("[data-notes-heading]", siteContent.sectionLabels.notesHeading);

  renderSkills();
  renderProjects();
  renderLearning();
  renderNotes();
  renderContact();
  renderFooter();
  setupAnimationState();
};
