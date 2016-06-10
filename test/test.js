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

describe('Fail tests', () => {
  it('Error: Give the source directory and destination directory', () => {
    return syncy('test').catch((err) => {
      assert.ok(/Give the source/.test(err));
    });
  });
});

describe('Default tasks', () => {
  it('Copying', () => {
    return syncy(['test/fixtures/**/*'], '.tmp/glob').then(() => {
      const result = recurseReadDir('.tmp/glob');
      assert.equal(result.length, 8);
    });
  });

  it('Copying with base', () => {
    return syncy(['test/fixtures/**'], '.tmp/base', { base: 'test/fixtures' })
      .then(() => {
        const result = recurseReadDir('.tmp/base');
        assert.equal(result.length, 8);
      });
  });

  it('Removing files', () => {
    createFiles('.tmp/remove/test/fixtures', 3);
    return syncy(['test/fixtures/**'], '.tmp/remove').then(() => {
      const result = recurseReadDir('.tmp/remove');
      assert.equal(result.length, 8);
    });
  });

  it('Skipping files', () => {
    return syncy(['test/fixtures/**'], '.tmp/skip').then(() => {
      return syncy(['test/fixtures/**'], '.tmp/skip');
    }).then(() => {
      const result = recurseReadDir('.tmp/skip');
      assert.equal(result.length, 8);
    });
  });
});

describe('Updating files', () => {
  it('Remove file in `dest`', () => {
    return syncy(['test/fixtures/**'], '.tmp/update_dest').then(() => {
      // Remove one file in the destination directory
      fs.unlinkSync('.tmp/update_dest/test/fixtures/folder-1/test.txt');
      return syncy(['test/fixtures/**'], '.tmp/update_dest');
    }).then(() => {
      const result = recurseReadDir('.tmp/update_dest');
      assert.equal(result.length, 8);
    });
  });

  it('Remove file in `src`', () => {
    // Backup test files
    copyRecursiveSync('test/fixtures', '.tmp/fixtures_backup');
    syncy(['.tmp/fixtures_backup/**'], '.tmp/update_src').then(() => {
      // Remove one file in the source directory
      fs.unlinkSync('.tmp/fixtures_backup/folder-1/test.txt');
      return syncy(['.tmp/fixtures_backup/**'], '.tmp/update_src');
    }).then(() => {
      const result = recurseReadDir('.tmp/update_src');
      assert.equal(result.length, 7);
    });
  });

  it('Remove file in `src` (with `**/*` pattern)', () => {
    // Backup test files
    copyRecursiveSync('test/fixtures', '.tmp/fixtures_backup_issue_1');
    return syncy(['.tmp/fixtures_backup_issue_1/**/*.txt'], '.tmp/issue_1').then(() => {
      // Remove one file in the source directory
      fs.unlinkSync('.tmp/fixtures_backup_issue_1/folder-1/test.txt');
      return syncy(['.tmp/fixtures_backup_issue_1/**/*.txt'], '.tmp/issue_1');
    }).then(() => {
      const result = recurseReadDir('.tmp/issue_1');
      assert.equal(result.length, 7);
    });
  });

  it('Update the contents of a file', () => {
    // Backup test files
    copyRecursiveSync('test/fixtures', '.tmp/fixtures_backup');
    return syncy(['test/fixtures/**'], '.tmp/update_content', {
      base: 'test/fixtures'
    }).then(() => {
      fs.writeFileSync('.tmp/fixtures_backup/folder-2/test.txt', 'test');
      return syncy(['.tmp/fixtures_backup/**'], '.tmp/update_content', {
        base: '.tmp/fixtures_backup'
      });
    }).then(() => {
      const data = fs.readFileSync('.tmp/update_content/folder-2/test.txt', 'utf-8');
      assert.equal(data, 'test');
    });
  });

  it('No update and delete files from dest (updateAndDelete)', () => {
    createFiles('.tmp/update_nodelete/test/fixtures', 3);
    return syncy(['test/fixtures/**'], '.tmp/update_nodelete', {
      updateAndDelete: false
    }).then(() => {
      const result = recurseReadDir('.tmp/update_nodelete');
      // File `test-2.txt` overwritten
      assert.equal(result.length, 10);
    });
  });
});

describe('Console information', () => {
  it('Verbose', () => {
    // Hook for console output
    const clgDump = console.log;
    let stdout = '';
    console.log = function() {
      stdout += JSON.stringify(arguments);
    };

    return syncy(['test/fixtures/**'], '.tmp/verbose', { verbose: true }).then(() => {
      console.log = clgDump;
      assert.equal(/test\/fixtures\/test-2.txt/.test(stdout), true);
    });
  });
});

describe('Ignore files', () => {
  it('Ignore `test-0.txt` in dest directory (ignoreInDest)', () => {
    createFiles('.tmp/single_ignore/test/fixtures', 1);
    return syncy(['test/fixtures/**'], '.tmp/single_ignore', {
      ignoreInDest: '**/test-0.txt'
    }).then(() => {
      const result = recurseReadDir('.tmp/single_ignore');
      assert.equal(result.length, 9);
    });
  });
});
