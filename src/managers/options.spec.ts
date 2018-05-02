import * as assert from 'assert';

import * as manager from './options';

describe('Managers → Options', () => {
	describe('.prepare', () => {
		it('should returns builded options for empty object', () => {
			const expected: manager.IOptions = {
				verbose: false,
				base: '',
				updateAndDelete: true,
				allowOverwrite: true,
				ignoreInDest: []
			};

			const actual = manager.prepare();

			assert.deepEqual(actual, expected);
		});

		it('should returns builded options for provided object', () => {
			const expected: manager.IOptions = {
				verbose: false,
				base: 'base',
				updateAndDelete: true,
				allowOverwrite: true,
				ignoreInDest: []
			};

			const actual = manager.prepare({ base: 'base' });

			assert.deepEqual(actual, expected);
		});

		it('should returns builded options for provided object with allowOverwrite implicitly defaulted', () => {
			const expected: manager.IOptions = {
				verbose: false,
				base: '',
				updateAndDelete: false,
				allowOverwrite: false,
				ignoreInDest: []
			};

			const actual = manager.prepare({ updateAndDelete: false });

			assert.deepEqual(actual, expected);
		});

		it('should returns builded options for provided object with allowOverwrite explicitly set', () => {
			const expected: manager.IOptions = {
				verbose: false,
				base: '',
				updateAndDelete: false,
				allowOverwrite: true,
				ignoreInDest: []
			};

			const actual = manager.prepare({ updateAndDelete: false, allowOverwrite: true });

			assert.deepEqual(actual, expected);
		});
	});
});
