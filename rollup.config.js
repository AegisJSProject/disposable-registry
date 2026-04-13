import terser from '@rollup/plugin-terser';

export default [{
	input: 'registry.js',
	output: [{
		file: 'registry.cjs',
		format: 'cjs',
	}, {
		file: 'registry.min.js',
		format: 'esm',
		plugins: [terser()],
		sourcemap: true,
	}],
}];
