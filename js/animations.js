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

