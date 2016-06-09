'use strict';

const path = require('path');
const fs = require('fs');

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
module.exports.fromDestToSrcPath = (dest, destOrig, opts) => {
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
module.exports.fromSrcToDestPath = (src, dest, opts) => {
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
module.exports.expandDirTree = (filepath) => {
  filepath = filepath.split('/');
  const arr = [filepath[0]];
  filepath.reduce((sum, current) => {
    const next = path.join(sum, current).replace(/\\/g, '/');
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
module.exports.compareTime = (srcTime, destTime) => {
  return srcTime.ctime.getTime() < destTime.ctime.getTime();
};
