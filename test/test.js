'use strict';

var path = require('path');
var fs = require('fs');
var assert = require('assert');
var mkdir = require('mkdirp');

var syncy = require('..');
var existsSync = require('../lib/files').existsStatSync;

// Recursively read a directory
var recurseReadDir = function(root, files, prefix) {
  prefix = prefix || '';
  files = files || [];

  var dir = path.join(root, prefix);
  if (!existsSync(dir)) {
    return files;
  }
  if (fs.statSync(dir).isDirectory()) {
    fs.readdirSync(dir).forEach(function(name) {
      recurseReadDir(root, files, path.join(prefix, name));
    });
  } else {
    files.push(prefix);
  }

  return files;
};

// Creating test files
var createFiles = function(filepath, count) {
  mkdir.sync(filepath);
  for (var i = 0; i < count; i++) {
    var testFile = path.join(filepath, 'test-' + i + '.txt');
    fs.writeFileSync(testFile, 'test');
  }
};

// Look ma, it's cp -R.
var copyRecursiveSync = function(src, dest) {
  var exists = existsSync(src);
  var stats = exists && fs.statSync(src);
  var isDirectory = exists && stats.isDirectory();
  if (exists && isDirectory) {
    mkdir.sync(dest);
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.writeFileSync(dest, fs.readFileSync(src));
  }
};

describe('Default tasks', function() {
  it('Copying', function(done) {
    syncy(['test/fixtures/**/*'], '.tmp/glob')
      .on('end', function() {
        var result = recurseReadDir('.tmp/glob');
        assert.equal(result.length, 8);
        done();
      })
      .end();
  });

  it('Copying with base', function(done) {
    syncy(['test/fixtures/**'], '.tmp/base', { base: 'test/fixtures' })
      .on('end', function() {
        var result = recurseReadDir('.tmp/base');
        assert.equal(result.length, 8);
        done();
      })
      .end();
  });

  it('Removing files', function(done) {
    createFiles('.tmp/remove/test/fixtures', 3);
    syncy(['test/fixtures/**'], '.tmp/remove')
      .on('end', function() {
        var result = recurseReadDir('.tmp/remove');
        assert.equal(result.length, 8);
        done();
      })
      .end();
  });

  it('Skipping files', function(done) {
    syncy(['test/fixtures/**'], '.tmp/skip')
      .on('end', function() {
        syncy(['test/fixtures/**'], '.tmp/skip')
          .on('end', function() {
            var result = recurseReadDir('.tmp/skip');
            assert.equal(result.length, 8);
            done();
          })
          .end();
      })
      .end();
  });
});

describe('Updating files', function() {
  it('Remove file in `dest`', function(done) {
    syncy(['test/fixtures/**'], '.tmp/update_dest')
      .on('end', function() {
        // Remove one file in the destination directory
        fs.unlinkSync('.tmp/update_dest/test/fixtures/folder-1/test.txt');
        syncy(['test/fixtures/**'], '.tmp/update_dest')
          .on('end', function() {
            var result = recurseReadDir('.tmp/update_dest');
            assert.equal(result.length, 8);
            done();
          })
          .end();
      })
      .end();
  });

  it('Remove file in `src`', function(done) {
    // Backup test files
    copyRecursiveSync('test/fixtures', '.tmp/fixtures_backup');
    syncy(['.tmp/fixtures_backup/**'], '.tmp/update_src')
      .on('end', function() {
        // Remove one file in the source directory
        fs.unlinkSync('.tmp/fixtures_backup/folder-1/test.txt');
        syncy(['.tmp/fixtures_backup/**'], '.tmp/update_src')
          .on('end', function() {
            var result = recurseReadDir('.tmp/update_src');
            assert.equal(result.length, 7);
            done();
          })
          .end();
      })
      .end();
  });

  it('Update the contents of a file', function(done) {
    copyRecursiveSync('test/fixtures', '.tmp/fixtures_backup');
    syncy(['test/fixtures/**'], '.tmp/update_content', { base: 'test/fixtures' })
      .on('end', function() {
        fs.writeFileSync('.tmp/fixtures_backup/folder-2/test.txt', 'test');
        syncy(['.tmp/fixtures_backup/**'], '.tmp/update_content', { base: '.tmp/fixtures_backup' })
          .on('end', function() {
            var data = fs.readFileSync('.tmp/update_content/folder-2/test.txt', 'utf-8');
            assert.equal(data, 'test');
            done();
          })
          .end();
      })
      .end();
  });

  it('No update and delete files from dest (updateAndDelete)', function(done) {
    createFiles('.tmp/update_nodelete/test/fixtures', 3);
    syncy(['test/fixtures/**'], '.tmp/update_nodelete', { updateAndDelete: false })
      .on('end', function() {
        var result = recurseReadDir('.tmp/update_nodelete');
        // File `test-2.txt` overwritten
        assert.equal(result.length, 10);
        done();
      })
      .end();
  });
});

describe('Console information', function() {
  it('Verbose', function(done) {
    // Hook for console output
    var clgDump = console.log;
    var stdout = '';
    console.log = function() {
      stdout += JSON.stringify(arguments);
    };

    syncy(['test/fixtures/**'], '.tmp/verbose', { verbose: true })
      .on('end', function() {
        assert.equal(/test\/fixtures\/test-2.txt/.test(stdout), true);
        console.log = clgDump;
        done();
      })
      .end();
  });
});

describe('Ignore files', function() {
  it('Ignore `test-0.txt` in dest directory (ignoreInDest)', function(done) {
    createFiles('.tmp/single_ignore/test/fixtures', 1);
    syncy(['test/fixtures/**'], '.tmp/single_ignore', {
      ignoreInDest: '**/test-0.txt'
    })
      .on('end', function() {
        var result = recurseReadDir('.tmp/single_ignore');
        assert.equal(result.length, 9);
        done();
      })
      .end();
  });
});
