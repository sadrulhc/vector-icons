class GitilesDelegate extends ExtensionDelegate {
  extractTextContent(table) {
    var txt = '';
    table.querySelectorAll('.FileContents-line').forEach(
        r => txt += r.textContent + "\n");
    return txt;
  }

  onPanelCreated(panel) {
    var table = document.querySelector('.FileContents');
    table.parentNode.insertBefore(panel, table);
  }
};

setUpExtension('.FileContents', new GitilesDelegate());
