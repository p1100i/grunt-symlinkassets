var
  root,
  grunt,
  prefix,
  symlinks,
  fs        = require('fs'),
  path      = require('path'),
  chalk     = require('chalk'),
  cheerio   = require('cheerio'),

  symlinkTypes = {
    '.js' : {
      'tag'       : 'script',
      'attribute' : 'src'
    },

    '.css' : {
      'tag'       : 'link',
      'attribute' : 'href'
    }
  },

  log = function log(chalkColor, messages) {
    grunt.log.writeln(chalkColor.apply(this, messages));
  },

  isSymlink = function isSymlink(nodeInfo, nodePath) {
    return nodeInfo.lstat.isSymbolicLink();
  },

  getAssetSelector = function getAssetSelector(symlinkType, src) {
    return symlinkType.tag + '[' + symlinkType.attribute + '="' + src + '"]';
  },

  getSwappingMessage = function getSwappingMessage(symlinkType, src, newSrc) {
    return symlinkType.attribute + ' on <' + symlinkType.tag + '> : ' + src + ' => ' + newSrc;
  },

  useSymlinkedAssets = function useSymlinkedAssets(HTML) {
    var
      src,
      tag,
      target,
      symlink,
      newSrc,
      selector,
      $ = cheerio.load(HTML);

    for (target in symlinks) {
      symlink     = symlinks[target];
      symlinkType = symlinkTypes[symlink.ext];
      src         = path.join(symlink.src, symlink.target);
      newSrc      = path.join(symlink.src, symlink.name);
      selector    = getAssetSelector(symlinkType, src);
      tag         = $(selector);

      if (tag.length) {
        tag.attr(symlinkType.attribute, newSrc);
        log(chalk.green, ['swapping asset ' + getSwappingMessage(symlinkType, src, newSrc)]);
      } else {
        log(chalk.blue, ['no asset found for selector ' + selector]);
      }
    }

    return $.html();
  },

  getNodeInfo = function getNodeInfo(nodePath) {
    var
      lstat = fs.lstatSync(nodePath),
      ext   = path.extname(nodePath),
      dir   = path.dirname(nodePath),
      name  = path.basename(nodePath),
      base  = path.basename(nodePath, ext);

    return {
      'lstat' : lstat,
      'ext'   : ext,
      'dir'   : dir,
      'name'  : name,
      'base'  : base
    };
  },

  addSymlinkData = function addSymlinkData(nodeInfo, nodePath) {
    var
      target      = fs.readlinkSync(nodePath),
      dirs        = nodeInfo.dir.split(path.sep),
      rootIndex   = dirs.indexOf(root);

    dirs = dirs.slice(rootIndex + 1);

    if (prefix !== undefined) {
      dirs.unshift(prefix);
    }

    src = dirs.join(path.sep);

    nodeInfo.target = target;
    nodeInfo.tag    = symlinkTypes[nodeInfo.ext].tag;
    nodeInfo.src    = src;
  },

  scanSymlink = function scanSymlink(nodePath) {
    var
      nodeInfo  = getNodeInfo(nodePath),
      isSymlink = nodeInfo.lstat.isSymbolicLink(),
      target;

    if (!isSymlink) {
      return;
    }

    addSymlinkData(nodeInfo, nodePath);

    symlinks[nodeInfo.target] = nodeInfo;
  },


  scanSymlinks = function scanSymlinks(files) {
    files.src.forEach(scanSymlink);
  },


  scanHTML = function scanHTML(nodePath) {
    var
      nodeInfo = getNodeInfo(nodePath),
      HTML;

    if (nodeInfo.ext !== '.html') {
      return;
    }

    log(chalk.green, ['scanning ' + nodePath]);

    HTML = grunt.file.read(nodePath);
    HTML = useSymlinkedAssets(HTML);

    grunt.file.write(nodePath, HTML);
  },

  scanHTMLs = function scanHTMLs(files) {
    files.src.forEach(scanHTML);
  },

  run = function run() {
    symlinks  = {};
    prefix    = this.data.prefix;
    root      = this.data.root;

    this.files.forEach(scanSymlinks);
    this.files.forEach(scanHTMLs);
  },

  exportTask = function exportTask(gruntObj) {
    grunt = gruntObj;

    grunt.registerMultiTask('symlinkassets', 'Swap asset src/href using symlinks.', run);
  };

module.exports = exportTask;
