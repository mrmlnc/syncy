# SyncY

> One-way synchronization of directories with [glob](https://github.com/isaacs/node-glob).

[![Travis](https://img.shields.io/travis/mrmlnc/syncy.svg?style=flat-square)](https://travis-ci.org/mrmlnc/syncy)
[![NPM version](https://img.shields.io/npm/v/syncy.svg?style=flat-square)](https://www.npmjs.com/package/syncy)

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
syncy(patterns, dest, [options])
```

#### patterns

  * Type: `string|string[]`

Glob patterns that represent files to copy

#### dest

  * Type: `string|string[]`

Destination directory or directories.

#### options

  * Type: `object`

```js
{
  // Display log messages when copying and removing files
  verbose: false,
  // Or create your own function.
  verbose: (stamp) {
    // action - `copy` or `remove`
    // to - only for `copy` action
    console.log(stamp.action + ' | ' + stamp.from + ' | ' + stamp.to);
  },
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
  * Node.js v6.4.0

**Files**: [AngularJS](https://github.com/angular/angular.js/releases/tag/v1.6.0-rc.1) from release v1.6.0-rc.1.

**Note**: `UpdateAndDelete` option is enabled in the grunt-sync, because other plugins have this option initially.

| Description of tests                                 | syncy | gulp-directory-sync | grunt-sync |
|------------------------------------------------------|-------|---------------------|------------|
| First run                                            | 3,7s  | 9,1s                | 10,1s      |
| Re-run                                               | 0,7s  | 1,0s                | 0,8s       |
| Delete single file from dest directory               | 0,7s  | 0,9s                | 0,8s       |


## Changelog

See the [Releases section of our GitHub project](https://github.com/mrmlnc/syncy/releases) for changelogs for each release version.

## License

This software is released under the terms of the MIT license.
