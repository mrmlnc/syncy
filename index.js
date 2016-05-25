'use strict';

var fs = require('fs');
var through = require('through2');
var chalk = require('chalk');
var Promise = require('promise');
var statP = Promise.denodeify(fs.stat);
var rimrafP = Promise.denodeify(require('rimraf'));
var objectAssign = require('object-assign');
var globby = require('globby');
var globParent = require('glob-parent');
var cpf = require('cp-file');

var files = require('./lib/files');

var plugin = function(src, dest, options) {
  var opts = objectAssign({
    updateAndDelete: true,
    verbose: false,
    ignoreInDest: []
  }, options);

  return through.obj(function(file, encoding, cb) {
    this.push(file);
    cb();
  }, function(cb) {
    var _that = this;
    if (!src || !dest) {
      this.emit('error', 'Give the source directory and destination directory');
      return cb();
    }

    // If `verbose` mode is enabled
    var log = (opts.verbose) ? console.log : function() {};

    // Remove latest slash for base path
    if (opts.base && opts.base.slice(-1) === '/') {
      opts.base = opts.base.slice(0, -1);
    }

    // If destination directory not exists create it
    if (!files.existsStatSync(dest)) {
      require('mkdirp').sync(dest);
    }

    // Settings for globby
    var globPromises = [
      globby(src, { dot: true, nosort: true }),
      globby('**', {
        cwd: dest,
        dot: true,
        nosort: true,
        ignore: Array.isArray(opts.ignoreInDest) ? opts.ignoreInDest : [opts.ignoreInDest]
      })
    ];

    Promise.all(globPromises)
      .then(function(results) {
        // Deleting files
        if (opts.updateAndDelete) {
          // Create a full list of the basic directories
          var basePaths = [''];
          src.forEach(function(srcGlob) {
            var baseDir = files.expandDirTree(globParent(srcGlob));
            basePaths = basePaths.concat(baseDir);
          });

          // Search unique files to the destination directory
          // To files in the source directory are added paths to basic directories
          var fullSourcePaths = results[0].concat(basePaths);
          results[1] = results[1].filter(function(filepath) {
            var fullpath = files.fromDestToSrcPath(filepath, dest, opts);
            for (var i = 0; i < fullSourcePaths.length; i++) {
              if (fullSourcePaths[i].indexOf(fullpath) + 1) {
                return false;
              }
            }

            return true;
          });

          // Creating promises to delete files
          results[1] = results[1].map(function(destPath) {
            var fullpath = files.fromSrcToDestPath(destPath, dest, {});
            return rimrafP(fullpath, { glob: false })
              .then(log(chalk.red('Removing: ') + fullpath))
              .catch(function(err) {
                _that.emit('error', 'Cannot remove `' + fullpath + '`: ' + err.code);
                return cb();
              });
          });
        }

        // Copying files
        results[0] = results[0].map(function(srcPath) {
          var to = files.fromSrcToDestPath(srcPath, dest, opts);
          var statSrc = statP(srcPath);
          var statDest = statP(to).catch(function() {});
          return Promise.all([statSrc, statDest]).then(function(stats) {
            // Update file?
            if ((typeof stats[1] !== 'undefined' && !opts.updateAndDelete) ||
              stats[0].isDirectory() || stats[1] && files.compareTime(stats[0], stats[1])) {
              return false;
            }

            return cpf(srcPath, to)
              // Display log messages when copying files
              .then(log(chalk.green('Copying: ') + srcPath + chalk.cyan(' -> ') + to))
              .catch(function(err) {
                _that.emit('error', 'Cannot copy from `' + srcPath + '` to `' + to + '`: ' + err.message);
                return cb();
              });
          });
        });

        // Flatten nested array.
        return Promise.all(results.reduce(function(a, b) {
          return a.concat(b);
        }));
      })
      .then(function() {
        _that.resume();
        cb();
      })
      .catch(function(err) {
        _that.emit('error', err);
        return cb();
      });
  });
};

module.exports = plugin;
