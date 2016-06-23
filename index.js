'use strict';

const fs = require('fs');
const chalk = require('chalk');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const globby = require('globby');
const globParent = require('glob-parent');
const cpf = require('cp-file');

const files = require('./lib/files');

function statP(filepath) {
  return new Promise((resolve, reject) => {
    fs.stat(filepath, (err, stats) => {
      if (err) {
        reject(err);
      }

      resolve(stats);
    });
  });
}

function rimrafP(filepath, options) {
  return new Promise((resolve, reject) => {
    rimraf(filepath, options, (err) => {
      if (err) {
        reject(err);
      }

      resolve();
    });
  });
}

function m(src, dest, options) {
  options = Object.assign({
    updateAndDelete: true,
    verbose: false,
    ignoreInDest: []
  }, options);

  return new Promise((resolve, reject) => {
    if (!src || !dest) {
      reject('Give the source directory and destination directory');
    }

    // Globby only works with an array
    if (!Array.isArray(src)) {
      src = [src];
    }

    // If `verbose` mode is enabled
    const log = (options.verbose) ? console.log : function() { };

    // Remove latest slash for base path
    if (options.base && options.base.slice(-1) === '/') {
      options.base = options.base.slice(0, -1);
    }

    // If destination directory not exists create it
    if (!files.existsStatSync(dest)) {
      mkdirp.sync(dest);
    }

    // Settings for globby
    const globPromises = [
      globby(src, { dot: true, nosort: true }),
      globby('**', {
        cwd: dest,
        dot: true,
        nosort: true,
        ignore: Array.isArray(options.ignoreInDest) ? options.ignoreInDest : [options.ignoreInDest]
      })
    ];

    Promise.all(globPromises)
      .then((results) => {
        // Deleting files
        if (options.updateAndDelete) {
          // Create a full list of the basic directories
          let basePaths = [''];
          src.forEach((srcGlob) => {
            const baseDir = files.expandDirTree(globParent(srcGlob));
            basePaths = basePaths.concat(baseDir);
          });

          // Search unique files to the destination directory
          // To files in the source directory are added paths to basic directories
          const fullSourcePaths = results[0].concat(basePaths);
          results[1] = results[1].filter((filepath) => {
            const fullpath = files.fromDestToSrcPath(filepath, dest, options);
            for (let i = 0; i < fullSourcePaths.length; i++) {
              if (fullSourcePaths[i].indexOf(fullpath) + 1) {
                return false;
              }
            }

            return true;
          });

          // Creating promises to delete files
          results[1] = results[1].map((destPath) => {
            const fullpath = files.fromSrcToDestPath(destPath, dest, {});
            return rimrafP(fullpath, { glob: false })
              .then(log(chalk.red('Removing: ') + fullpath))
              .catch((err) => {
                reject(`Cannot remove '${fullpath}': ${err.code}`);
              });
          });
        }

        // Copying files
        results[0] = results[0].map((srcPath) => {
          const to = files.fromSrcToDestPath(srcPath, dest, options);
          const statSrc = statP(srcPath);
          const statDest = statP(to).catch(() => {});
          return Promise.all([statSrc, statDest]).then((stats) => {
            // Update file?
            if (files.skipUpdate(stats[0], stats[1], options)) {
              return;
            }

            return cpf(srcPath, to)
              // Display log messages when copying files
              .then(log(chalk.green('Copying: ') + srcPath + chalk.cyan(' -> ') + to))
              .catch((err) => {
                reject(`'${srcPath}'' to '${to}': ${err.message}`);
              });
          });
        });

        // Flatten nested array.
        resolve(Promise.all(results[0].concat(results[1])));
      });
  });
}

module.exports = m;
