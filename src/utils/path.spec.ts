import * as assert from 'assert';

import * as util from './path';

describe('Utils → Path', () => {
	it('normalizePath', () => {
		assert.ok(util.normalizePath('test\\file.js').indexOf('\\') === -1);
	});

	it('pathFromDestToSource', () => {
		assert.equal(util.pathFromDestToSource('file.js', 'dest'), 'dest/file.js');
	});

	it('pathFromSourceToDest', () => {
		assert.equal(util.pathFromSourceToDest('src/file.js', 'dest', 'src'), 'dest/file.js');
	});

	it('expandDirectoryTree', () => {
		const tree = util.expandDirectoryTree('src/files/**/*.js');

		assert.ok(tree.indexOf('src') !== -1);
		assert.ok(tree.indexOf('src/files') !== -1);
	});
});
