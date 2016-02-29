# SyncY

> One-way synchronization of directories with [glob](https://github.com/isaacs/node-glob).

[![Travis](https://img.shields.io/travis/mrmlnc/syncy.svg?style=flat-square)](https://travis-ci.org/mrmlnc/syncy)
[![NPM version](https://img.shields.io/npm/v/syncy.svg?style=flat-square)](https://www.npmjs.com/package/syncy)
[![devDependency Status](https://img.shields.io/david/mrmlnc/syncy.svg?style=flat-square)](https://david-dm.org/mrmlnc/syncy#info=dependencies)
[![devDependency Status](https://img.shields.io/david/dev/mrmlnc/syncy.svg?style=flat-square)](https://david-dm.org/mrmlnc/syncy#info=devDependencies)

## Install

```
$ npm install --save syncy
```

## Why?

  * Fast by using streams and Promises. Used [cp-file](https://github.com/sindresorhus/cp-file) and [rimraf](https://github.com/isaacs/rimraf).
  * User-friendly by accepting globs.

## Usage

```js
const syncy = require('syncy');

syncy(['src/**', '!src/folder/**'], 'dest')
  .on('error', console.error)
  .end();
```

## How to work with Gulp?

```js
const gulp = require('gulp');
const syncy = require('syncy');

gulp.task('sync', () => {
  syncy(['node_modules/gulp/**'], 'dest')
    .on('error', console.error)
    .end();
});
```

## How to work with Grunt?

```js
const syncy = require('syncy');

module.exports = (grunt) => {
  // Default task(s).
  grunt.registerTask('default', function() {
    const done = this.async();
    syncy(['node_modules/grunt/**'], 'dest')
      .on('error', console.error)
      .on('end', () => {
        done();
      })
      .end();
  });
};
```

## API

```
syncy(glob, dest, [options])
```

#### glob

Type: `array|string`

Glob pattern. Files to copy.

#### dest

Type: `string`

Destination directory.

#### options

Type: `object`

Plugin settings.

## Options

```js
{
  // Display log messages when copying and removing files
  verbose: false,
  // The base path to be removed from the path. Default: none
  base: 'base_path'
  // Remove all files from dest that are not found in src. Default: false
  updateAndDelete: true,
  // Never remove js files from destination. Default: false
  ignoreInDest: '**/*.js'
}
```

## Tests

**Tech specs**:

  * Intel Core i7-3610QM
  * RAM 8GB
  * SSD (555MB/S, 530MB/S)
  * Windows 10
  * Node.js v4.2.4

**Files**: [AngularJS](https://github.com/angular/angular.js) from master branch (1462 files, 19368Кб)

**Note**: `UpdateAndDelete` option is enabled in the grunt-sync, because other plugins have this option initially.

| Description of tests                              | syncy | gulp-directory-sync | grunt-sync |
|---------------------------------------------------|-------|---------------------|------------|
| First run                                         | 2,4s  | 4,5s                | 5,8s       |
| Re-run                                            | 0,6s  | 0,8s                | 0,7s       |
| Changed single file                               | 0,6s  | 0,8s                | 0,7s       |
| Delete files from destination directories and run | 2,3s  | 4,5s                | 5,7s       |
| Delete files from the source directory            | 0,5s  | 0,5s                | 0,5s       |

## Changelog

  * **v1.0.0** (2016-02-29) — Initialization().

## License

MIT.
