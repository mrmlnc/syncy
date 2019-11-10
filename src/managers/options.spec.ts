import * as assert from 'assert';

import * as manager from './options';

describe('Managers → Options', () => {
	describe('.prepare', () => {
		it('should returns builded options for empty object', () => {
			const expected: manager.Options = {
				verbose: false,
				base: '',
				updateAndDelete: true,
				ignoreInDest: []
			};

			const actual = manager.prepare();

			assert.deepStrictEqual(actual, expected);
		});

		it('should returns builded options for provided object', () => {
			const expected: manager.Options = {
				verbose: false,
				base: 'base',
				updateAndDelete: true,
				ignoreInDest: []
			};

			const actual = manager.prepare({ base: 'base' });

			assert.deepStrictEqual(actual, expected);
		});
	});
});
