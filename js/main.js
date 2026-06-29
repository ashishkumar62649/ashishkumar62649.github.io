(async () => {
  setTheme(getPreferredTheme());
  await loadContent();
  renderContent();
  setupInteractions();
  updatePhaseTwo();
  updateScrollProgress();
})();
