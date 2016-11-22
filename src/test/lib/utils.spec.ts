'use strict';

import * as fs from 'fs';
import * as assert from 'assert';

import * as utils from '../../lib/utils';

describe('Utils', () => {

	it('normalizePath', () => {
		assert.ok(utils.normalizePath('test\\file.js').indexOf('\\') === -1);
	});

	it('pathFromDestToSource', () => {
		assert.equal(utils.pathFromDestToSource('file.js', 'dest'), 'dest/file.js');
	});

	it('pathFromSourceToDest', () => {
		assert.equal(utils.pathFromSourceToDest('src/file.js', 'dest', 'src'), 'dest/file.js');
	});

	it('expandDirectoryTree', () => {
		const tree = utils.expandDirectoryTree('src/files/**/*.js');

		assert.ok(tree.indexOf('src') !== -1);
		assert.ok(tree.indexOf('src/files') !== -1);
	});

	it('compareTime', () => {
		assert.ok(utils.compareTime(<fs.Stats>{ ctime: new Date(10 * 1000) }, <fs.Stats>{ ctime: new Date(100 * 1000) }));
		assert.ok(!utils.compareTime(<fs.Stats>{ ctime: new Date(100 * 1000) }, <fs.Stats>{ ctime: new Date(10 * 1000) }));
	});

});

describe('skipUpdate', () => {

	it('Skip by directory', () => {
		const source = <fs.Stats>{
			isDirectory: () => true
		};

		const dest = <fs.Stats>{};

		assert.ok(utils.skipUpdate(source, dest, true));
	});

	it('No skip by directory', () => {
		const source = <fs.Stats>{
			isDirectory: () => false,
			ctime: new Date(100 * 1000)
		};

		const dest = <fs.Stats>{
			ctime: new Date(10 * 1000)
		};

		assert.ok(!utils.skipUpdate(source, dest, true));
	});

	it('Skip by options', () => {
		const source = <fs.Stats>{};
		const dest = <fs.Stats>{};

		assert.ok(utils.skipUpdate(source, dest, false));
	});

	it('No skip by options', () => {
		const source = <fs.Stats>{
			isDirectory: () => false,
			ctime: new Date(10 * 1000)
		};

		const dest = <fs.Stats>{
			ctime: new Date(100 * 1000)
		};

		assert.ok(utils.skipUpdate(source, dest, true));
	});

	it('Skip by time', () => {
		const source = <fs.Stats>{
			isDirectory: () => false,
			ctime: new Date(10 * 1000)
		};

		const dest = <fs.Stats>{
			ctime: new Date(100 * 1000)
		};

		assert.ok(utils.skipUpdate(source, dest, true));
	});

	it('No skip by time', () => {
		const source = <fs.Stats>{
			isDirectory: () => false,
			ctime: new Date(100 * 1000)
		};

		const dest = <fs.Stats>{
			ctime: new Date(10 * 1000)
		};

		assert.ok(!utils.skipUpdate(source, dest, true));
	});

});
