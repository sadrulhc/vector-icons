function notimplemented(msg) { console.log('notimplemented: ' + msg); }

class VectorIcon {
  constructor(commands) {
    this.commands_ = commands;
    this.lastCommand_ = undefined;
    this.canvas_ = null;
    this.ctx_ = null;
    this.lastPoint_ = [0, 0];
  }

  paint(container) {
    var ncmds = this.commands_.length;
    this.svg_ = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg_.setAttribute('width', '26');
    this.svg_.setAttribute('height', '26');
    this.svg_.classList.add('vector-svg');
    container.appendChild(this.svg_);
    this.paths_ = [];
    this.currentPath_ = this.createPath();
    this.pathD_ = [];
    for (var i = 0; i < ncmds; ++i)
      this.processCommand(this.commands_[i]);
    if (this.pathD_.length > 0)
      this.currentPath_.setAttribute('d', this.pathD_.join(' '));
  }

  createPath() {
    if (this.currentPath_) {
      this.currentPath_.setAttribute('d', this.pathD_.join(' '));
      this.pathD_ = [];
    }
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-width', '1');
    path.setAttribute('stroke', 'gray');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('shape-rendering', 'geometricPrecision');
    path.setAttribute('fill', 'transparent');
    this.paths_.push(path);
    this.svg_.appendChild(path);
    return path;
  }

  processCommand(cmd) {
    if (cmd[0] == 'CANVAS_DIMENSIONS') {
      this.svg_.setAttribute('width', cmd[1]);
      this.svg_.setAttribute('height', cmd[1]);
      return;
    }

    if (cmd[0] == 'NEW_PATH') {
      this.currentPath_ = this.createPath();
      return;
    }

    if (cmd[0] == 'PATH_COLOR_ARGB') {
      this.currentPath_.style['stroke'] = 'red';  // XXX:
      notimplemented('color not set correctly');
      return;
    }

    if (cmd[0] == 'PATH_MODE_CLEAR') {
      // XXX:
      notimplemented(cmd[0]);
      return;
    }

    if (cmd[0] == 'STROKE') {
      this.currentPath_.style['stroke-width'] = cmd[1] + 'px';
      return;
    }

    if (cmd[0] == 'CAP_SQUARE') {
      this.currentPath_.style['stroke-linecap'] = 'square';
      return;
    }

    var drawCommands = {
      'MOVE_TO': 'M',
      'R_MOVE_TO': 'm',
      'ARC_TO': 'A',
      'R_ARC_TO': 'a',
      'LINE_TO': 'L',
      'R_LINE_TO': 'l',
      'H_LINE_TO': 'H',
      'R_H_LINE_TO': 'h',
      'V_LINE_TO': 'V',
      'R_V_LINE_TO': 'v',
      'CUBIC_TO': 'C',
      'R_CUBIC_TO': 'c',
      'CUBIC_TO_SHORTHAND': 'S',
      'CLOSE': 'Z',
    };
    if (cmd[0] in drawCommands) {
      var nc = [drawCommands[cmd[0]]].concat(cmd.splice(1).map(parseFloat));
      this.pathD_.push(nc.join(' '));
      return;
    }
  }
};

function updatePreviewIfVectorIcon(source_code) {
  if (!window.location.pathname.endsWith('.icon'))
    return;
  var inp = source_code.textContent;
  var lines = inp.split('\n');
  var commands = lines.map(function(line) {
    return line.trim().split(',').filter(function(x) {return x.length > 0;});
  });

  var icon = new VectorIcon(commands);
  icon.paint(source_code.parentNode.querySelectorAll('.preview-container')[0]);
}

function setUpPreviewPanel(source_code) {
  if (!source_code)
    return;

  var div = document.createElement('div');
  div.classList.add('preview-panel');
  source_code.parentNode.insertBefore(div, source_code.nextElementSibling);
  
  var button = document.createElement('button');
  button.textContent = 'Preview';
  // div.appendChild(button);

  var container = document.createElement('div');
  container.classList.add('preview-container');
  div.appendChild(container);

  button.onclick = function() {
    updatePreviewIfVectorIcon(source_code);
  };

  var observer = new MutationObserver(function(mutations) {
    container.innerHTML = '';
    updatePreviewIfVectorIcon(source_code);
  });
  observer.observe(source_code, { childList: true });
}

setUpPreviewPanel(document.getElementById('source_code'));

// Make sure to set up a preview panel for any |source_code| panel that gets
// added.
var observer = new MutationObserver(function(mutations) {
	mutations.forEach(function(mutation) {
		for (var i = 0; i < mutation.addedNodes.length; i++)
			if (mutation.addedNodes[i].id == 'source_code')
        setUpPreviewPanel(mutation.addedNodes[i]);
	});
});
observer.observe(document, { childList: true, subtree: true });
