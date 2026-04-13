import { imports } from '@shgysk8zer0/importmap';
import { addTrustedTypePolicy, addScriptSrc, useDefaultCSP } from '@aegisjsproject/http-utils/csp.js';

addScriptSrc(
	'https://unpkg.com/@aegisjsproject/',
	'https://unpkg.com/@shgysk8zer0/',
);

addTrustedTypePolicy('aegis-sanitizer#html');

export default {
	routes: {
		'/': '@aegisjsproject/dev-server',
		'/favicon.svg': '@aegisjsproject/dev-server/favicon',
		'/index.js': () => new Response(`
			import { registerKey, getFromRegistry, hasRegistryKey, listRegistryKeys, Registry } from '@aegisjsproject/disposable-registry';

			const stack = new DisposableStack();
			const reg = new Registry({ stack });
			registerKey('uuid', crypto.randomUUID(), reg);

			globalThis.stack = stack;
			globalThis.registerKey = (key, val) => registerKey(key, val, reg);
			globalThis.getFromRegistry = key => getFromRegistry(key, reg);
			globalThis.hasRegistryKey = key => hasRegistryKey(key, reg);
			globalThis.listRegistryKeys = () => listRegistryKeys(reg);
		`, { headers: { 'Content-Type': 'application/javascript' }}),
	},
	open: true,
	requestPreprocessors: [
		'@aegisjsproject/http-utils/request-id.js',
	],
	responsePostprocessors: [
		'@aegisjsproject/http-utils/compression.js',
		'@aegisjsproject/http-utils/cors.js',
		useDefaultCSP(),
		(response, { request }) => {
			if (request.destination === 'document') {
				response.headers.append('Link', `<${imports['@shgysk8zer0/polyfills']}>; rel="preload"; as="script"; fetchpriority="high"; crossorigin="anonymous"; referrerpolicy="no-referrer"`);
			}
		},
	],
};
