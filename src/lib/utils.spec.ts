'use strict';

import * as assert from 'assert';
import * as fs from 'fs';

import * as utils from './utils';

describe('Utils', () => {

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
