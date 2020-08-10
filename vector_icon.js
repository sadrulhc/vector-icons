// See LICENSE

const SVG_NS = 'http://www.w3.org/2000/svg';
const SCALE = 4;

function notimplemented(msg) {
  console.log('notimplemented(vector-icon): ' + msg);
}

class ExtensionDelegate {
  // Extracts text content from |node|. The returned text content should be
  // the contents of the .icon file.
  extractTextContent(node) { return ''; }

  // Returns the svg element when it's created. The delegate can choose to
  // embed it where it wants.
  onPanelCreated(panel) {}
};

class VectorIcon {
  constructor(commands, delegate) {
    this.commands_ = commands;
    this.delegate_ = delegate;
    this.svg_ = null;
    this.paths_ = [];
    this.currentPath_ = null;
    this.pathD_ = [];
    this.clipRect_ = null;
    this.finished_svg_ = null;
  }

  paint() {
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
    return this.svg_;
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
    var rx = parseFloat(params[4]);
    // We can probably not add the arcs if rx == 0?
    var cmds = [
      ['M', x + rx, y],
      ['h', width - rx - rx],
      ['a', rx, rx, 0, 0, 1, rx, rx],
      ['v', height - rx - rx],
      ['a', rx, rx, 0, 0, 1, -rx, rx],
      ['h', -(width - rx - rx)],
      ['a', rx, rx, 0, 0, 1, -rx, -rx],
      ['v', -(height - rx - rx)],
      ['a', rx, rx, 0, 0, 1, rx, -rx]
    ];
    cmds.forEach(cmd => this.pathD_.push(cmd.join(' ')));
  }

  processCommand(cmd) {
    if (cmd[0] == 'CANVAS_DIMENSIONS') {
      if(this.finished_svg_ === null) {
        this.svg_.setAttribute('width', cmd[1]);
        this.svg_.setAttribute('height', cmd[1]);
        // Start the svg (svg is not finished)
        this.finished_svg_ = false;
      } else if(this.finished_svg_ === false) {
        // This is a new svg (previous is done)
        this.finished_svg_ = true;
      }
      return;
    }

    if(this.finished_svg_) {
      return; // We already have an svg
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

function updatePreviewIfVectorIcon(source_code, delegate, container) {
  if (!window.location.pathname.endsWith('.icon')) {
    if (container.parentNode)
      container.parentNode.removeChild(container);
    return;
  }
  container.style.disply = 'flex';
  delegate.onPanelCreated(container);
  var inp = delegate.extractTextContent(source_code);
  var lines = inp.split('\n').filter(
    line => (line.length && !line.startsWith('//'))
  );
  var commands =
      lines.map(line => line.trim().split(',').filter(x => x.length > 0));

  var icon = new VectorIcon(commands);
  var svg = icon.paint();

  var original = container.querySelector('#preview-original');
  original.innerHTML = '';
  original.appendChild(svg);

  var svgSource = (new XMLSerializer).serializeToString(svg);

  var scaledSvg = document.createElement('img');
  scaledSvg.setAttribute('width',
      parseFloat(svg.getAttribute('width')) * SCALE);
  scaledSvg.setAttribute('height',
      parseFloat(svg.getAttribute('height')) * SCALE);
  scaledSvg.setAttribute('src',
     'data:image/svg+xml;utf8,'+svgSource);

  var scaled = container.querySelector('#preview-scaled');
  scaled.innerHTML = '';
  scaled.appendChild(scaledSvg);
}

function setUpPreviewPanel(source_code, delegate) {
  if (!source_code)
    return;

  var container = document.createElement('div');
  container.id = 'preview-container';

  var orig = document.createElement('div');
  orig.id = 'preview-original';
  container.appendChild(orig);

  var scaled = document.createElement('div');
  scaled.id = 'preview-scaled';
  container.appendChild(scaled);
  updatePreviewIfVectorIcon(source_code, delegate, container);

  var observer = new MutationObserver(function(mutations) {
    updatePreviewIfVectorIcon(source_code, delegate, container);
  });
  observer.observe(source_code, { childList: true });
}

function setUpExtension(selector, delegate) {
  setUpPreviewPanel(document.querySelector(selector), delegate);

  // Make sure to set up a preview panel for any |source_code| panel that gets
  // added.
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      for (var i = 0; i < mutation.addedNodes.length; i++)
        if (mutation.addedNodes[i].id == 'source_code')
          setUpPreviewPanel(mutation.addedNodes[i], delegate);
    });
  });
  observer.observe(document, { childList: true, subtree: true });
}
