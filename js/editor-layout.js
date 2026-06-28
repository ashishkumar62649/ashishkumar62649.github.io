const currentContent = () => draftContent;
let autosaveTimer = 0;
let autosaveInFlight = false;
let autosaveQueued = false;

const runAutosave = async () => {
  if (!editorAvailable) return;
  if (autosaveInFlight) {
    autosaveQueued = true;
    return;
  }
  autosaveInFlight = true;
  try {
    const response = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftContent)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Autosave failed.");
    savedContent = structuredClone(draftContent);
    localStorage.removeItem(draftKey);
    toast("Saved");
  } catch (error) {
    toast(error.message || "Autosave failed.", true);
  } finally {
    autosaveInFlight = false;
    if (autosaveQueued) {
      autosaveQueued = false;
      saveDraft();
    }
  }
};
const saveDraft = () => {
  if (editorAvailable) {
    window.clearTimeout(autosaveTimer);
    autosaveTimer = window.setTimeout(runAutosave, 650);
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

const getLayoutEntry = (key) => draftContent.layout?.[key] || {};

const hasCustomLayout = (entry = {}) =>
  Number(entry.x || 0) !== 0 ||
  Number(entry.y || 0) !== 0 ||
  Number(entry.rotate || 0) !== 0 ||
  Number(entry.z || 0) !== 0 ||
  Boolean(entry.locked);

const setLayoutEntry = (key, patch) => {
  if (!key) return;
  draftContent.layout = draftContent.layout || {};
  const next = {
    x: 0,
    y: 0,
    rotate: 0,
    z: 0,
    locked: false,
    ...getLayoutEntry(key),
    ...patch
  };
  if (hasCustomLayout(next)) {
    draftContent.layout[key] = next;
  } else {
    delete draftContent.layout[key];
  }
};

const snapValue = (value, snap = layoutSnap) => Math.round(value / snap) * snap;

const getLayoutKeyForElement = (element) => {
  if (!element) return "";
  if (element.dataset.layoutKey) return element.dataset.layoutKey;
  if (element.dataset.editPath) return element.dataset.editPath;
  if (element.dataset.editGroup) return `group.${element.dataset.editGroup}`;
  return "";
};

const assignLayoutKeys = () => {
  if (!editorAvailable) return;
  $$("[data-edit-group], [data-edit-path], [data-layout-key], [data-link-key]").forEach((element) => {
    if (element.closest(".global-editor-dock, .editor-context-menu, .block-history-popover")) return;
    if (!element.dataset.layoutKey) {
      element.dataset.layoutKey = getLayoutKeyForElement(element) || element.dataset.linkKey || "";
    }
    if (element.dataset.layoutKey) element.classList.add("layout-target");
  });
};

const getLayoutTargets = (key) =>
  key ? $$(`[data-layout-key="${CSS.escape(key)}"]`).filter((element) => element.isConnected) : [];

const applyLayoutTransforms = () => {
  $$("[data-layout-key]").forEach((element) => {
    const key = element.dataset.layoutKey;
    const entry = getLayoutEntry(key);
    const x = Number(entry.x || 0);
    const y = Number(entry.y || 0);
    const rotate = Number(entry.rotate || 0);
    const z = Number(entry.z || 0);
    const locked = Boolean(entry.locked);
    if (hasCustomLayout(entry)) {
      element.classList.add("is-layout-positioned");
      element.style.setProperty("--layout-x", `${x}px`);
      element.style.setProperty("--layout-y", `${y}px`);
      element.style.setProperty("--layout-rotate", `${rotate}deg`);
      element.style.zIndex = z ? String(z) : "";
    } else {
      element.classList.remove("is-layout-positioned");
      element.style.removeProperty("--layout-x");
      element.style.removeProperty("--layout-y");
      element.style.removeProperty("--layout-rotate");
      element.style.zIndex = "";
    }
    element.classList.toggle("is-layout-locked", locked);
  });
  positionLayoutOverlay();
};

const getLayoutClickTarget = (node) => {
  const element = node?.closest?.("[data-layout-key], [data-edit-path], [data-edit-group], [data-link-key]");
  if (!element || element.closest(".global-editor-dock, .editor-context-menu, .block-history-popover, .layout-selection-overlay")) return null;
  return element;
};

const getSelectedLayoutElements = () =>
  selectedLayoutKeys.flatMap((key) => getLayoutTargets(key)).filter((element, index, list) => list.indexOf(element) === index);

const getSelectionRect = () => {
  const rects = getSelectedLayoutElements()
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);
  if (rects.length === 0) return null;
  return {
    left: Math.min(...rects.map((rect) => rect.left)),
    top: Math.min(...rects.map((rect) => rect.top)),
    right: Math.max(...rects.map((rect) => rect.right)),
    bottom: Math.max(...rects.map((rect) => rect.bottom))
  };
};

const selectLayoutTarget = (element, append = false) => {
  const key = getLayoutKeyForElement(element);
  if (!key) return;
  if (append) {
    selectedLayoutKeys = selectedLayoutKeys.includes(key)
      ? selectedLayoutKeys.filter((item) => item !== key)
      : [...selectedLayoutKeys, key];
  } else {
    selectedLayoutKeys = [key];
  }
  document.body.classList.add("has-layout-selection");
  renderLayoutSelection();
};

const clearLayoutSelection = () => {
  selectedLayoutKeys = [];
  document.body.classList.remove("has-layout-selection");
  renderLayoutSelection();
};

const renderLayoutSelection = () => {
  $$("[data-layout-key]").forEach((element) => element.classList.toggle("is-layout-selected", selectedLayoutKeys.includes(element.dataset.layoutKey)));
  const overlay = $(".layout-selection-overlay");
  if (!overlay) return;
  overlay.hidden = !editMode || selectedLayoutKeys.length === 0;
  if (!overlay.hidden) {
    const entry = getLayoutEntry(selectedLayoutKeys[0]);
    overlay.classList.toggle("is-locked", Boolean(entry.locked));
    overlay.querySelector("[data-layout-lock]").textContent = entry.locked ? "Unlock" : "Lock";
  }
  positionLayoutOverlay();
};

const positionLayoutOverlay = () => {
  const overlay = $(".layout-selection-overlay");
  if (!overlay || overlay.hidden) return;
  const rect = getSelectionRect();
  if (!rect) {
    overlay.hidden = true;
    return;
  }
  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.width = `${Math.max(24, rect.right - rect.left)}px`;
  overlay.style.height = `${Math.max(24, rect.bottom - rect.top)}px`;
};

const showLayoutGuides = (rect) => {
  const vGuide = $(".layout-guide-v");
  const hGuide = $(".layout-guide-h");
  if (!vGuide || !hGuide || !rect) return;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const viewportCenterX = window.innerWidth / 2;
  const viewportCenterY = window.innerHeight / 2;
  const nearX = Math.abs(centerX - viewportCenterX) <= layoutSnap;
  const nearY = Math.abs(centerY - viewportCenterY) <= layoutSnap;
  vGuide.hidden = !nearX;
  hGuide.hidden = !nearY;
  if (nearX) vGuide.style.left = `${viewportCenterX}px`;
  if (nearY) hGuide.style.top = `${viewportCenterY}px`;
};

const hideLayoutGuides = () => {
  $(".layout-guide-v")?.setAttribute("hidden", "");
  $(".layout-guide-h")?.setAttribute("hidden", "");
};

const startLayoutMove = (event) => {
  if (selectedLayoutKeys.length === 0) return;
  const locked = selectedLayoutKeys.some((key) => getLayoutEntry(key).locked);
  if (locked) {
    toast("Unlock this object before moving it.", true);
    return;
  }
  event.preventDefault();
  pushGlobalHistory();
  activeLayoutGesture = {
    type: "move",
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startEntries: Object.fromEntries(selectedLayoutKeys.map((key) => [key, { x: 0, y: 0, rotate: 0, z: 0, locked: false, ...getLayoutEntry(key) }]))
  };
  document.body.classList.add("is-layout-dragging");
  event.currentTarget.setPointerCapture(event.pointerId);
};

const startLayoutRotate = (event) => {
  if (selectedLayoutKeys.length === 0) return;
  const locked = selectedLayoutKeys.some((key) => getLayoutEntry(key).locked);
  if (locked) {
    toast("Unlock this object before rotating it.", true);
    return;
  }
  const rect = getSelectionRect();
  if (!rect) return;
  event.preventDefault();
  pushGlobalHistory();
  const center = { x: rect.left + (rect.right - rect.left) / 2, y: rect.top + (rect.bottom - rect.top) / 2 };
  activeLayoutGesture = {
    type: "rotate",
    pointerId: event.pointerId,
    center,
    startAngle: Math.atan2(event.clientY - center.y, event.clientX - center.x) * 180 / Math.PI,
    startEntries: Object.fromEntries(selectedLayoutKeys.map((key) => [key, { x: 0, y: 0, rotate: 0, z: 0, locked: false, ...getLayoutEntry(key) }]))
  };
  document.body.classList.add("is-layout-dragging");
  event.currentTarget.setPointerCapture(event.pointerId);
};

const updateLayoutGesture = (event) => {
  if (!activeLayoutGesture || event.pointerId !== activeLayoutGesture.pointerId) return;
  if (activeLayoutGesture.type === "move") {
    const dx = snapValue(event.clientX - activeLayoutGesture.startX);
    const dy = snapValue(event.clientY - activeLayoutGesture.startY);
    Object.entries(activeLayoutGesture.startEntries).forEach(([key, entry]) => {
      setLayoutEntry(key, { x: Number(entry.x || 0) + dx, y: Number(entry.y || 0) + dy });
    });
  } else {
    const angle = Math.atan2(event.clientY - activeLayoutGesture.center.y, event.clientX - activeLayoutGesture.center.x) * 180 / Math.PI;
    const delta = Math.round((angle - activeLayoutGesture.startAngle) / rotateSnap) * rotateSnap;
    Object.entries(activeLayoutGesture.startEntries).forEach(([key, entry]) => {
      setLayoutEntry(key, { rotate: Number(entry.rotate || 0) + delta });
    });
  }
  applyLayoutTransforms();
  const rect = getSelectionRect();
  if (rect) showLayoutGuides({ left: rect.left, top: rect.top, width: rect.right - rect.left, height: rect.bottom - rect.top });
};

const finishLayoutGesture = (event) => {
  if (!activeLayoutGesture || event.pointerId !== activeLayoutGesture.pointerId) return;
  document.body.classList.remove("is-layout-dragging");
  hideLayoutGuides();
  activeLayoutGesture = null;
  saveDraft();
  renderLayoutSelection();
  toast("Layout saved");
};

const resetSelectedLayout = () => {
  if (selectedLayoutKeys.length === 0) return;
  pushGlobalHistory();
  draftContent.layout = draftContent.layout || {};
  selectedLayoutKeys.forEach((key) => delete draftContent.layout[key]);
  saveDraft();
  applyLayoutTransforms();
  renderLayoutSelection();
  toast("Position reset");
};

const changeSelectedLayer = (direction) => {
  if (selectedLayoutKeys.length === 0) return;
  pushGlobalHistory();
  selectedLayoutKeys.forEach((key) => {
    const entry = getLayoutEntry(key);
    setLayoutEntry(key, { z: Math.max(0, Number(entry.z || 0) + direction) });
  });
  saveDraft();
  applyLayoutTransforms();
  renderLayoutSelection();
};

const toggleSelectedLock = () => {
  if (selectedLayoutKeys.length === 0) return;
  const next = !getLayoutEntry(selectedLayoutKeys[0]).locked;
  pushGlobalHistory();
  selectedLayoutKeys.forEach((key) => setLayoutEntry(key, { locked: next }));
  saveDraft();
  applyLayoutTransforms();
  renderLayoutSelection();
  toast(next ? "Object locked" : "Object unlocked");
};

