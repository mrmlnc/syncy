import * as assert from 'assert';

import * as util from './path';

describe('Utils → Path', () => {
	it('normalizePath', () => {
		assert.ok(!util.normalizePath('test\\file.js').includes('\\'));
	});

	it('pathFromDestToSource', () => {
		assert.strictEqual(util.pathFromDestinationToSource('file.js', 'dest'), 'dest/file.js');
	});

	it('pathFromSourceToDest', () => {
		assert.strictEqual(util.pathFromSourceToDestination('src/file.js', 'dest', 'src'), 'dest/file.js');
	});

	it('expandDirectoryTree', () => {
		const tree = util.expandDirectoryTree('src/files/**/*.js');

		assert.ok(tree.includes('src'));
		assert.ok(tree.includes('src/files'));
	});
});
