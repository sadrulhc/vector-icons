class CSDelegate extends ExtensionDelegate {
  extractTextContent(node) {
    return node.textContent;
  }

  onPanelCreated(panel) {
    var node = document.querySelector('#middlepanel');
    node.insertBefore(panel, node.firstChild);
  }
};

setUpExtension('#source_code', new CSDelegate());
