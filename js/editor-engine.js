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
    button.textContent = "Edit";
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
  positionLayoutOverlay();
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
    <button class="editor-float" type="button" aria-label="Toggle edit mode" aria-pressed="false" title="Edit mode">Edit</button>
    <div class="draft-bar" hidden>
      <button class="editor-icon-button" type="button" data-save-draft title="Save changes" aria-label="Save changes">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M5 4h12l2 2v14H5z" />
          <path d="M8 4v6h8V4" />
          <path d="M8 20v-6h8v6" />
        </svg>
      </button>
      <button class="editor-icon-button" type="button" data-global-undo title="Go back" aria-label="Go back">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M9 7H5v4" />
          <path d="M5 11c1.8-3.1 5.3-4.7 8.7-3.9 3.4.8 5.8 3.8 5.8 7.3" />
          <path d="M19.5 14.4c0 1.9-.9 3.7-2.4 4.8" />
        </svg>
      </button>
      <button class="editor-icon-button" type="button" data-global-redo title="Go forward" aria-label="Go forward">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M15 7h4v4" />
          <path d="M19 11c-1.8-3.1-5.3-4.7-8.7-3.9-3.4.8-5.8 3.8-5.8 7.3" />
          <path d="M4.5 14.4c0 1.9.9 3.7 2.4 4.8" />
        </svg>
      </button>
    </div>
    <div class="block-history-popover" hidden>
      <button type="button" data-block-save>Save</button>
      <button type="button" data-block-link>Link</button>
      <button type="button" data-block-back>Go back</button>
      <button type="button" data-block-forward>Go forward</button>
    </div>
    <div class="layout-grid-overlay" hidden></div>
    <div class="layout-guide layout-guide-v" hidden></div>
    <div class="layout-guide layout-guide-h" hidden></div>
    <div class="layout-selection-overlay" hidden>
      <button class="layout-move-handle" type="button" data-layout-move title="Move">+</button>
      <button class="layout-rotate-handle" type="button" data-layout-rotate title="Rotate"></button>
      <div class="layout-toolbar">
        <button type="button" data-layout-reset title="Reset position">Reset</button>
        <button type="button" data-layout-backward title="Send backward">Back</button>
        <button type="button" data-layout-forward title="Bring forward">Front</button>
        <button type="button" data-layout-lock title="Lock">Lock</button>
      </div>
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
    draftBar.insertAdjacentHTML("beforeend", `<span class="editor-drag-handle" title="Drag editor controls">Drag</span>`);
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
  $(".theme-toggle")?.insertAdjacentHTML("afterend", `<button class="background-edit-button" type="button" aria-label="Edit current background" title="Edit current background">BG</button>`);
  $(".editor-float").addEventListener("click", () => {
    editMode = !editMode;
    document.body.classList.toggle("is-editing", editMode);
    $(".editor-float").setAttribute("aria-pressed", String(editMode));
    $(".draft-bar").hidden = !editMode;
    $(".layout-grid-overlay").hidden = !editMode;
    if (!editMode) clearLayoutSelection();
    scheduleInlineControlPosition();
    renderLayoutSelection();
  });
  $("[data-save-draft]")?.addEventListener("click", saveContent);
  $("[data-block-save]").addEventListener("click", saveActiveBlock);
  $("[data-block-link]").addEventListener("click", linkSelectionInActiveBlock);
  $("[data-block-back]").addEventListener("click", undoActiveBlock);
  $("[data-block-forward]").addEventListener("click", redoActiveBlock);
  $("[data-global-undo]")?.addEventListener("click", undoGlobalChange);
  $("[data-global-redo]")?.addEventListener("click", redoGlobalChange);
  $("[data-layout-move]")?.addEventListener("pointerdown", startLayoutMove);
  $("[data-layout-rotate]")?.addEventListener("pointerdown", startLayoutRotate);
  $("[data-layout-reset]")?.addEventListener("click", resetSelectedLayout);
  $("[data-layout-forward]")?.addEventListener("click", () => changeSelectedLayer(1));
  $("[data-layout-backward]")?.addEventListener("click", () => changeSelectedLayer(-1));
  $("[data-layout-lock]")?.addEventListener("click", toggleSelectedLock);
  document.addEventListener("pointermove", updateLayoutGesture);
  document.addEventListener("pointerup", finishLayoutGesture);
  document.addEventListener("pointercancel", finishLayoutGesture);
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
  if (event.target.closest(".global-editor-dock, .editor-context-menu, .block-history-popover, .image-picker, .layout-selection-overlay")) return;
  const editButton = event.target.closest("[data-inline-edit-group]");
  const addButton = event.target.closest("[data-add-card]");
  const addSkillButton = event.target.closest("[data-add-skill-category]");
  const addSkillCategoryButton = event.target.closest("[data-add-skill-category-root]");
  const addSocialButton = event.target.closest("[data-add-social-link]");
  const deleteSocialButton = event.target.closest("[data-delete-social-link]");
  const deleteButton = event.target.closest("[data-delete-card]");
  const editableImage = event.target.closest("[data-edit-kind='image']");
  const editableField = event.target.closest("[data-edit-path]");
  const inlineLink = event.target.closest("a.inline-text-link, a.element-link-wrap, a.link-with-arrow");
  const layoutTarget = getLayoutClickTarget(event.target);

  if (!editMode && (editButton || addButton || addSkillButton || addSkillCategoryButton || addSocialButton || deleteSocialButton || deleteButton || editableImage)) return;

  if (editMode && layoutTarget) {
    selectLayoutTarget(layoutTarget, event.shiftKey);
    if (event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
  } else if (editMode && !event.target.closest("button, a, input, textarea, [contenteditable='true']")) {
    clearLayoutSelection();
  }

  if (editMode && addSkillCategoryButton) {
    event.preventDefault();
    event.stopPropagation();
    addSkillCategory();
    return;
  }
  if (editMode && addSocialButton) {
    event.preventDefault();
    event.stopPropagation();
    addSocialLink();
    return;
  }
  if (editMode && deleteSocialButton) {
    event.preventDefault();
    event.stopPropagation();
    deleteSocialLink(Number(deleteSocialButton.dataset.deleteSocialLink));
    return;
  }

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
    toast("Saved");
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
    toast("Saved");
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
  if (pathValue === "about.ctaText") value = value.replace(/[\u2190-\u2193\u2196-\u2199\u21b1-\u21b4\u279a\u279c]/g, "").trim();
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

  if (!selectedText && linkElement) selectedText = linkElement.textContent.replace(/[\u2190-\u2193\u2196-\u2199\u21b1-\u21b4\u279a\u279c]/g, "").trim();
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
  toast(url.trim() ? "Link added" : "Link removed");
};

const getSelectedEditableField = () => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const node = selection.anchorNode?.nodeType === Node.TEXT_NODE ? selection.anchorNode.parentElement : selection.anchorNode;
  const field = node?.closest?.("[data-edit-path]");
  if (!field) return null;
  return { selection, field, selectedText: selection.toString().replace(/\s+/g, " ").trim() };
};

const cleanLinkedText = (value) => String(value || "").replace(/[\u2190-\u2193\u2196-\u2199\u21b1-\u21b4\u279a\u279c]/g, "").replace(/\s+/g, " ").trim();

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
  toast(url.trim() ? "Link added" : "Link removed");
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
  toast("Link removed");
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
  toast("Description saved");
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
  toast(detachedLinks.length > 0 ? "Saved, but one link is not attached to visible text." : "Saved", detachedLinks.length > 0);
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
  renderLayoutSelection();
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
  renderLayoutSelection();
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
  toast("Saved");
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
    toast("Image saved");
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
  toast("New card added");
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
  toast(`New ${category} tool added`);
};

const addSkillCategory = () => {
  const baseName = "New category";
  const existing = new Set(normalizeArray(draftContent.skills).map((skill) => skill.category || "Tools"));
  let category = baseName;
  let suffix = 2;
  while (existing.has(category)) {
    category = `${baseName} ${suffix}`;
    suffix += 1;
  }
  pushGlobalHistory();
  draftContent.skills.push({
    name: "New skill",
    category,
    description: "Description",
    icon: ""
  });
  saveDraft();
  renderContent();
  toast("New stack category added");
};

const addSocialLink = () => {
  pushGlobalHistory();
  draftContent.contact = draftContent.contact || {};
  draftContent.contact.socialLinks = normalizeArray(draftContent.contact.socialLinks);
  draftContent.contact.socialLinks.push({
    label: "New link",
    url: "#",
    icon: ""
  });
  saveDraft();
  renderContent();
  toast("New social link added");
};

const deleteSocialLink = (index) => {
  const links = normalizeArray(draftContent.contact?.socialLinks);
  if (!links[index] || !window.confirm("Delete this social link?")) return;
  pushGlobalHistory();
  links.splice(index, 1);
  draftContent.contact.socialLinks = links;
  saveDraft();
  activeGroup = null;
  activeEditable = null;
  renderContent();
  toast("Social link removed");
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
  toast("Card removed");
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
  clearLayoutSelection();
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

