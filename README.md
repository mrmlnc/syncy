# SyncY

> One-way synchronization of directories with [glob](https://github.com/isaacs/node-glob).

[![Travis](https://img.shields.io/travis/mrmlnc/syncy.svg?style=flat-square)](https://travis-ci.org/mrmlnc/syncy)
[![NPM version](https://img.shields.io/npm/v/syncy.svg?style=flat-square)](https://www.npmjs.com/package/syncy)
[![devDependency Status](https://img.shields.io/david/mrmlnc/syncy.svg?style=flat-square)](https://david-dm.org/mrmlnc/syncy#info=dependencies)
[![devDependency Status](https://img.shields.io/david/dev/mrmlnc/syncy.svg?style=flat-square)](https://david-dm.org/mrmlnc/syncy#info=devDependencies)

## Install

```
$ npm i -S syncy
```

## Why?

  * Fast by using streams and Promises. Used [cp-file](https://github.com/sindresorhus/cp-file) and [rimraf](https://github.com/isaacs/rimraf).
  * User-friendly by accepting globs.

## Usage

```js
const syncy = require('syncy');

syncy(['src/**', '!src/folder/**'], 'dest')
  .then(() => {
    console.log('Done!'); 
  })
  .catch(console.error);
```

## API

```
syncy(glob, dest, [options])
```

#### glob

Type: `array|string`<br>
Default: `null`

Glob pattern. Files to copy.

#### dest

Type: `string`<br>
Default: `null`

Destination directory.

#### options

Type: `object`<br>
Default: `see options section`

Module settings.

## Options

```js
{
  // Display log messages when copying and removing files
  verbose: false,
  // The base path to be removed from the path. Default: none
  base: 'base_path'
  // Remove all files from dest that are not found in src. Default: true
  updateAndDelete: true,
  // Never remove js files from destination. Default: false
  ignoreInDest: '**/*.js'
}
```

## How to work with Gulp?

```js
const gulp = require('gulp');
const syncy = require('syncy');

gulp.task('sync', (done) => {
  syncy(['node_modules/gulp/**'], 'dest')
    .then(() => {
      done();
    })
    .catch((err) => {
      done(err);
    });
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
      .then(() => {
        done();
      })
      .catch((err) => {
        done(err);
      });
  });
};
```

## Tests

**Tech specs**:

  * Intel Core i7-3610QM
  * RAM 8GB
  * SSD (555MB/S, 530MB/S)
  * Windows 10
  * Node.js v6.2.1

**Files**: [AngularJS](https://github.com/angular/angular.js/releases/tag/v1.5.6) from release v1.5.6.

**Note**: `UpdateAndDelete` option is enabled in the grunt-sync, because other plugins have this option initially.

| Description of tests                                 | syncy | gulp-directory-sync | grunt-sync |
|------------------------------------------------------|-------|---------------------|------------|
| First run                                            | 2,7s  | 6,0s                | 7,4s       |
| Re-run                                               | 0,7s  | 0,9s                | 0,8s       |
| Changed single file                                  | 0,7s  | 0,9s                | 0,8s       |
| Delete `images` from destination directories and run | 0,9s  | 1,2s                | 1,4s       |
| Delete `images` from the source directory and run    | 1,1s  | 0,7s                | 1,3s       |

## Changelog

See the [Releases section of our GitHub project](https://github.com/mrmlnc/syncy/releases) for changelogs for each release version.

## License

This software is released under the terms of the MIT license.
