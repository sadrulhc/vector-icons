class FileDelegate extends ExtensionDelegate {
  extractTextContent(data) {
    var txt = '';
    txt += data.lastChild.lastChild.textContent;
    return txt;
  }

  onPanelCreated(panel) {
    var table = document.querySelector("body").lastChild.lastChild;
    document.querySelector("body").lastChild.insertBefore(panel, table);
  }
};

setUpExtension('body', new FileDelegate());
