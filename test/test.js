'use strict';

const path = require('path');
const fs = require('fs');
const assert = require('assert');
const mkdir = require('mkdirp');

const syncy = require('..');
const existsSync = require('../lib/files').existsStatSync;

// Recursively read a directory
function recurseReadDir(root, files, prefix) {
  prefix = prefix || '';
  files = files || [];

  const dir = path.join(root, prefix);
  if (!existsSync(dir)) {
    return files;
  }

  if (fs.statSync(dir).isDirectory()) {
    fs.readdirSync(dir).forEach((name) => {
      recurseReadDir(root, files, path.join(prefix, name));
    });
  } else {
    files.push(prefix);
  }

  return files;
}

// Creating test files
function createFiles(filepath, count) {
  mkdir.sync(filepath);
  for (let i = 0; i < count; i++) {
    const testFile = path.join(filepath, 'test-' + i + '.txt');
    fs.writeFileSync(testFile, 'test');
  }
}

// Look ma, it's cp -R.
function copyRecursiveSync(src, dest) {
  const exists = existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (exists && isDirectory) {
    mkdir.sync(dest);
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });

    return;
  }

  fs.writeFileSync(dest, fs.readFileSync(src));
}

describe('Default tasks', () => {
  it('Copying', (done) => {
    const stream = syncy(['test/fixtures/**/*'], '.tmp/glob');

    stream.on('end', () => {
      const result = recurseReadDir('.tmp/glob');
      assert.equal(result.length, 8);
      done();
    });

    stream.end();
  });

  it('Copying with base', (done) => {
    const stream = syncy(['test/fixtures/**'], '.tmp/base', {
      base: 'test/fixtures'
    });

    stream.on('end', () => {
      const result = recurseReadDir('.tmp/base');
      assert.equal(result.length, 8);
      done();
    });

    stream.end();
  });

  it('Removing files', (done) => {
    createFiles('.tmp/remove/test/fixtures', 3);
    const stream = syncy(['test/fixtures/**'], '.tmp/remove');

    stream.on('end', () => {
      const result = recurseReadDir('.tmp/remove');
      assert.equal(result.length, 8);
      done();
    });

    stream.end();
  });

  it('Skipping files', (done) => {
    const stream = syncy(['test/fixtures/**'], '.tmp/skip');

    stream.on('end', () => {
      syncy(['test/fixtures/**'], '.tmp/skip')
        .on('end', () => {
          const result = recurseReadDir('.tmp/skip');
          assert.equal(result.length, 8);
          done();
        })
        .end();
    });

    stream.end();
  });
});

describe('Updating files', () => {
  it('Remove file in `dest`', (done) => {
    const streamOne = syncy(['test/fixtures/**'], '.tmp/update_dest');
    const streamTwo = syncy(['test/fixtures/**'], '.tmp/update_dest');

    streamOne.on('end', () => {
      // Remove one file in the destination directory
      fs.unlinkSync('.tmp/update_dest/test/fixtures/folder-1/test.txt');

      streamTwo.on('end', () => {
        const result = recurseReadDir('.tmp/update_dest');
        assert.equal(result.length, 8);
        done();
      });

      streamTwo.end();
    });

    streamOne.end();
  });

  it('Remove file in `src`', (done) => {
    // Backup test files
    copyRecursiveSync('test/fixtures', '.tmp/fixtures_backup');

    const streamOne = syncy(['.tmp/fixtures_backup/**'], '.tmp/update_src');
    const streamTwo = syncy(['.tmp/fixtures_backup/**'], '.tmp/update_src');

    streamOne.on('end', () => {
      // Remove one file in the source directory
      fs.unlinkSync('.tmp/fixtures_backup/folder-1/test.txt');

      streamTwo.on('end', () => {
        const result = recurseReadDir('.tmp/update_src');
        assert.equal(result.length, 7);
        done();
      });

      streamTwo.end();
    });

    streamOne.end();
  });

  it('Remove file in `src` (with `**/*` pattern)', (done) => {
    // Backup test files
    copyRecursiveSync('test/fixtures', '.tmp/fixtures_backup_issue_1');

    const streamOne = syncy(['.tmp/fixtures_backup_issue_1/**/*.txt'], '.tmp/issue_1');
    const streamTwo = syncy(['.tmp/fixtures_backup_issue_1/**/*.txt'], '.tmp/issue_1');

    streamOne.on('end', () => {
      // Remove one file in the source directory
      fs.unlinkSync('.tmp/fixtures_backup_issue_1/folder-1/test.txt');

      streamTwo.on('end', () => {
        const result = recurseReadDir('.tmp/issue_1');
        assert.equal(result.length, 7);
        done();
      });

      streamTwo.end();
    });

    streamOne.end();
  });

  it('Update the contents of a file', (done) => {
    // Backup test files
    copyRecursiveSync('test/fixtures', '.tmp/fixtures_backup');

    const streamOne = syncy(['test/fixtures/**'], '.tmp/update_content', {
      base: 'test/fixtures'
    });

    const streamtwo = syncy(['.tmp/fixtures_backup/**'], '.tmp/update_content', {
      base: '.tmp/fixtures_backup'
    });

    streamOne.on('end', () => {
      fs.writeFileSync('.tmp/fixtures_backup/folder-2/test.txt', 'test');

      streamtwo.on('end', () => {
        const data = fs.readFileSync('.tmp/update_content/folder-2/test.txt', 'utf-8');
        assert.equal(data, 'test');
        done();
      });

      streamtwo.end();
    });

    streamOne.end();
  });

  it('No update and delete files from dest (updateAndDelete)', (done) => {
    createFiles('.tmp/update_nodelete/test/fixtures', 3);

    const stream = syncy(['test/fixtures/**'], '.tmp/update_nodelete', {
      updateAndDelete: false
    });

    stream.on('end', () => {
      const result = recurseReadDir('.tmp/update_nodelete');
      // File `test-2.txt` overwritten
      assert.equal(result.length, 10);
      done();
    });

    stream.end();
  });
});

describe('Console information', () => {
  it('Verbose', (done) => {
    // Hook for console output
    const clgDump = console.log;
    let stdout = '';
    console.log = function() {
      stdout += JSON.stringify(arguments);
    };

    const stream = syncy(['test/fixtures/**'], '.tmp/verbose', {
      verbose: true
    });

    stream.on('end', () => {
      console.log = clgDump;
      assert.equal(/test\/fixtures\/test-2.txt/.test(stdout), true);
      done();
    });

    stream.end();
  });
});

describe('Ignore files', () => {
  it('Ignore `test-0.txt` in dest directory (ignoreInDest)', (done) => {
    createFiles('.tmp/single_ignore/test/fixtures', 1);
    const stream = syncy(['test/fixtures/**'], '.tmp/single_ignore', {
      ignoreInDest: '**/test-0.txt'
    });

    stream.on('end', () => {
      const result = recurseReadDir('.tmp/single_ignore');
      assert.equal(result.length, 9);
      done();
    });

    stream.end();
  });
});
