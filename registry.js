/**
 * @type {WeakMap<RegistryKey, Registry>}
 */
const _keys = new WeakMap();

export class RegistryKey extends String {
	#disposed = false;
	#ephemeral = true;

	/**
	 *
	 * @param {string|String} key
	 * @param {object} config
	 * @param {DisposableStack|AsyncDisposableStack} [config.stack]
	 * @param {boolean} [config.ephemeral=true]
	 */
	constructor(key, { stack, ephemeral = true } = {}) {
		if (stack?.disposed) {
			throw new TypeError('Cannot create a registry key using an already disposed stack.');
		} else if (typeof key === 'string') {
			super(key);
		} else if (key instanceof RegistryKey) {
			return key;
		} else if (key instanceof String) {
			super(key.toString());
		} else {
			throw new TypeError(`Invalid key type: ${typeof key}.`);
		}

		this.#ephemeral = ephemeral;

		if (stack instanceof DisposableStack || stack instanceof AsyncDisposableStack) {
			stack.use(this);
		}
	}

	[Symbol.dispose]() {
		if (_keys.has(this) && this.#ephemeral && ! this.#disposed) {
			const reg = _keys.get(this);
			const val = reg?.get?.(this.toString());

			val?.[Symbol.dispose]?.();
			reg?.delete?.(this.toString());
			_keys.delete(this);
			this.#disposed = true;
		}
	}

	get disposed() {
		return this.#disposed;
	}
}

export class Registry extends Map {
	#stack = new DisposableStack();
	#controller = this.#stack.adopt(
		new AbortController(),
		controller => controller.abort(new DOMException('Stack disposed', 'AbortError'))
	);

	constructor(iterable, { signal, stack } = {}) {
		if (signal instanceof AbortSignal && signal.aborted) {
			throw signal.reason;
		} else if ((stack instanceof DisposableStack || stack instanceof AsyncDisposableStack) && stack.disposed) {
			throw new TypeError('Cannot create a registry using an already disposed stack.');
		} else {
			super(iterable);

			if (stack instanceof DisposableStack || stack instanceof AsyncDisposableStack) {
				stack.use(this);
			}

			if (signal instanceof AbortSignal) {
				signal.addEventListener('abort', () => {
					this.#stack.dispose();
					this.clear();
				}, { signal: this.#controller.signal });
			}
		}
	}

	[Symbol.dispose]() {
		this.#stack.dispose();
		this.clear();
	}

	get disposed() {
		return this.#stack.disposed;
	}

	createKey(key = '__registryKey_' + crypto.randomUUID(), { ephemeral = true } = {}) {
		const regKey = new RegistryKey(key, { stack: this.#stack, ephemeral });
		_keys.set(regKey, this);
		return regKey;
	}
}

const _reg = new Registry();

/**
 *
 * @param {string|String|RegistryKey} key
 * @param {any} value
 * @param {Registry} reg
 * @returns {RegistryKey|undefined}
 */
export function registerKey(key, value, reg = _reg) {
	if (reg.disposed) {
		return undefined;
	} else if (reg.has(key?.toString())) {
		return undefined;
	} else {
		const regKey = reg.createKey(key);
		reg.set(regKey.toString(), value);
		return regKey;
	}
};

/**
 *
 * @param {string|String|RegistryKey} key
 * @param {Registry} reg
 * @returns {boolean}
 */
export function unregisterKey(key, reg = _reg) {
	if (reg.delete(key.toString())) {
		_keys.delete(key);
		return true;
	} else {
		return false;
	}
};

/**
 *
 * @param {string|String|RegistryKey} key
 * @param {Registry} reg
 * @returns {any}
 */
export const getFromRegistry = (key, reg = _reg) => reg.disposed ? null : reg?.get?.(key?.toString?.());

/**
 *
 * @param {string|String|RegistryKey} key
 * @param {Registry} reg
 * @returns {boolean}
 */
export const hasRegistryKey = (key, reg = _reg) => reg?.has?.(key?.toString?.());

/**
 *
 * @param {Registry} reg
 * @returns {boolean}
 */
export const registryIsDisposed = (reg = _reg) => reg?.disposed;

/**
 *
 * @param {Registry} reg
 * @returns {string[]}
 */
export const listRegistryKeys = (reg = _reg) => reg?.keys()?.toArray?.() ?? [];
