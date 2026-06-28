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
