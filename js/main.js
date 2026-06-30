(async () => {
  setTheme(getPreferredTheme());
  await loadContent();
  renderContent();
  setupInteractions();
  updatePhaseTwo();
  updateScrollProgress();
  
  // Remove the initial page load lock after the sunrise animation finishes
  window.setTimeout(() => {
    document.body.classList.add("theme-loaded");
  }, 3000);
})();
