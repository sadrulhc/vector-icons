// See LICENSE

const SVG_NS = 'http://www.w3.org/2000/svg';

function notimplemented(msg) {
  console.log('notimplemented(vector-icon): ' + msg);
}

class VectorIcon {
  constructor(commands) {
    this.commands_ = commands;
    this.svg_ = null;
    this.paths_ = [];
    this.currentPath_ = null;
    this.pathD_ = [];
    this.clipRect_ = null;
  }

  paint(container) {
    var ncmds = this.commands_.length;
    this.svg_ = document.createElementNS(SVG_NS, 'svg');
    this.svg_.setAttribute('width', '48');
    this.svg_.setAttribute('height', '48');
    this.svg_.setAttribute('fill-rule', 'evenodd');
    this.svg_.classList.add('vector-svg');
    this.currentPath_ = this.createPath();
    for (var i = 0; i < ncmds; ++i) {
      if (this.commands_[i][0] == 'END')
        break;
      this.processCommand(this.commands_[i]);
    }
    if (this.pathD_.length > 0)
      this.currentPath_.setAttribute('d', this.pathD_.join(' '));

    // Just set the clip-path on all paths, I guess?
    if (this.clipRect_) {
      var clipPath = document.createElementNS(SVG_NS, 'clipPath');
      clipPath.setAttribute('id', 'clip-path');
      this.svg_.appendChild(clipPath);

      var rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', this.clipRect_[0]);
      rect.setAttribute('y', this.clipRect_[1]);
      rect.setAttribute('width', this.clipRect_[2]);
      rect.setAttribute('height', this.clipRect_[3]);
      clipPath.appendChild(rect);

      this.paths_.forEach(
          path => path.setAttribute('clip-path', 'url(#clip-path)')
      );
    }

    // Add all the paths.
    var svg = this.svg_;
    this.paths_.forEach(path => svg.appendChild(path));

    container.appendChild(this.svg_);
    container.appendChild(document.createElement('br'));
    var large = this.svg_.cloneNode(true);
    large.classList.add('vector-large');
    container.appendChild(large);
  }

  closeCurrentPath() {
    if (this.currentPath_) {
      this.currentPath_.setAttribute('d', this.pathD_.join(' '));
      this.pathD_ = [];
      this.currentPath_ = null;
    }
  }

  createPath() {
    this.closeCurrentPath();
    var path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('fill', 'gray');
    path.setAttribute('stroke', 'gray');
    path.setAttribute('stroke-width', '0px');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('shape-rendering', 'geometricPrecision');
    this.paths_.push(path);
    return path;
  }

  createCircle(params) {
    var cx = parseFloat(params[0]);
    var cy = parseFloat(params[1]);
    var r = parseFloat(params[2]);
    var cmds = [
      ['M', cx, cy],
      ['m', -r, '0'],
      ['a', r, r, 0, 1, 0, r*2, 0],
      ['a', r, r, 0, 1, 0, -r*2, 0],
    ];
    cmds.forEach(cmd => this.pathD_.push(cmd.join(' ')));
  }

  createRoundRect(params) {
    var x = parseFloat(params[0]);
    var y = parseFloat(params[1]);
    var width = parseFloat(params[2]);
    var height = parseFloat(params[3]);
    var rx = parseFloat(params[4]);  // XXX: unused
    var cmds = [
      ['M', x, y],
      ['h', width],
      ['v', height],
      ['h', -width],
      ['v', -height]
    ];
    cmds.forEach(cmd => this.pathD_.push(cmd.join(' ')));
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
      var color =
          'rgba(' + [cmd[2], cmd[3], cmd[4], cmd[1]]
              .map(x => parseInt(x)).join(',') + ')';
      this.currentPath_.style['fill'] = color;
      this.currentPath_.style['stroke'] = color;
      return;
    }

    if (cmd[0] == 'PATH_MODE_CLEAR') {
      // XXX: what do?
      notimplemented(cmd[0]);
      return;
    }

    if (cmd[0] == 'STROKE') {
      this.currentPath_.setAttribute('stroke-width', cmd[1] + 'px');
      return;
    }

    if (cmd[0] == 'CAP_SQUARE') {
      this.currentPath_.style['stroke-linecap'] = 'square';
      return;
    }

    if (cmd[0] == 'DISABLE_AA') {
      this.currentPath_.setAttribute('shape-rendering', 'crispEdges');
      return;
    }

    if (cmd[0] == 'CLIP') {
      this.clipRect_ = cmd.splice(1).map(x => x.trim() + 'px');
      return;
    }

    if (cmd[0] == 'CIRCLE') {
      this.createCircle(cmd.splice(1));
      return;
    }

    if (cmd[0] == 'ROUND_RECT') {
      this.createRoundRect(cmd.splice(1));
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

    notimplemented(cmd.join(','));
  }
};

function updatePreviewIfVectorIcon(source_code, functor) {
  if (!window.location.pathname.endsWith('.icon'))
    return;
  var inp = functor(source_code);
  var lines = inp.split('\n').filter(
    line => (line.length && !line.startsWith('//'))
  );
  var commands =
      lines.map(line => line.trim().split(',').filter(x => x.length > 0));

  var icon = new VectorIcon(commands);
  icon.paint(source_code.parentNode.querySelectorAll('.preview-container')[0]);
}

function setUpPreviewPanel(source_code, functor) {
  if (!source_code)
    return;

  var div = document.createElement('div');
  div.classList.add('preview-panel');
  source_code.parentNode.insertBefore(div, source_code.nextElementSibling);
  
  var container = document.createElement('div');
  container.classList.add('preview-container');
  div.appendChild(container);
  updatePreviewIfVectorIcon(source_code, functor);

  var observer = new MutationObserver(function(mutations) {
    container.innerHTML = '';
    updatePreviewIfVectorIcon(source_code, functor);
  });
  observer.observe(source_code, { childList: true });
}

function setUpExtension(selector, functor) {
  setUpPreviewPanel(document.querySelector(selector), functor);

  // Make sure to set up a preview panel for any |source_code| panel that gets
  // added.
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      for (var i = 0; i < mutation.addedNodes.length; i++)
        if (mutation.addedNodes[i].id == 'source_code')
          setUpPreviewPanel(mutation.addedNodes[i], functor);
    });
  });
  observer.observe(document, { childList: true, subtree: true });
}
