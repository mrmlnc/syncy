var path = require('path');
var fs = require('fs');

/**
 * Test whether or not the given path exists by checking with the file system
 *
 * @param {String} filepath
 */
module.exports.existsStatSync = fs.existsSync || function(filePath) {
  try {
    fs.statSync(filePath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    }
  }

  return true;
};

/**
 * Processing path to the source directory from destination directory
 *
 * @param {String} srcPath
 * @param {String} dest
 * @param {Object} opts
 */
module.exports.fromDestToSrcPath = function(dest, destOrig, opts) {
  if (opts.base) {
    dest = path.join(opts.base, dest);
  }

  return dest.replace(/\\/g, '/');
};

/**
 * Processing path to the destination directory from source directory
 *
 * @param {String} srcPath
 * @param {String} dest
 * @param {Object} opts
 */
module.exports.fromSrcToDestPath = function(src, dest, opts) {
  if (opts.base) {
    src = path.relative(opts.base, src);
  }

  return path.join(dest, src).replace(/\\/g, '/');
};

/**
 * Expanding of the directories in path
 *
 * @param {String} filepath
 */
module.exports.expandDirTree = function(filepath) {
  filepath = filepath.split('/');
  var arr = [filepath[0]];
  filepath.reduce(function(sum, current) {
    var next = path.join(sum, current).replace(/\\/g, '/');
    arr.push(next);
    return next;
  });

  return arr;
};

/**
 * Compare update time of two files
 *
 * @param {Object} srcTime
 * @param {Object} destTime
 */
module.exports.compareTime = function(srcTime, destTime) {
  return srcTime.ctime.getTime() < destTime.ctime.getTime();
};
