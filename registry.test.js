import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
	Registry,
	registerKey,
	getFromRegistry,
	hasRegistryKey,
	listRegistryKeys,
} from './registry.js';

class DisposableAbortController extends AbortController {
	[Symbol.dispose]() {
		this.abort(new DOMException('Controller was disposed', 'AbortError'));
	}
}

describe('Disposable Registry', () => {

	it('registry tests', () => {
		const stack = new DisposableStack();
		const reg = new Registry([['foo', 'bar']], { stack });
		const controller = new DisposableAbortController();
		const key = registerKey('controller', controller, reg);

		assert.strictEqual(getFromRegistry(key, reg), controller, 'Retrieving from registry should return initial values.');
		assert.ok(hasRegistryKey(key, reg), 'Keys should be properly registered.');
		assert.deepStrictEqual(listRegistryKeys(reg), ['foo', 'controller'], 'Listing keys of registry should return expected array of keys.');
		stack.dispose();
		assert.strictEqual(getFromRegistry(key, reg), null, 'Retrieving from disposed registry should return null.');
		assert.ok(! hasRegistryKey(key, reg), 'Disposal should remove keys from registry');
		assert.ok(key.disposed, 'Disposal of stack should dispose of keys');
		assert.deepStrictEqual(listRegistryKeys(reg), [], 'Listing keys of disposed registry should return an empty array.');
		assert.ok(controller.signal.aborted, 'Disposing of stack should dispose of values as well.');
	});
});
