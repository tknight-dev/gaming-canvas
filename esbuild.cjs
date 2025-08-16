esbuild = require('esbuild');

/**
 * @author tknight-dev
 */

esbuild.build({
	bundle: true,
	entryPoints: {
		index: 'src/index.ts',
	},
	loader: {},
	format: 'cjs',
	metafile: false,
	minify: true,
	outdir: 'dist',
	outExtension: {
		'.js': '.cjs',
	},
	platform: 'node',
	plugins: [], // Don't set plugins here
	sourcemap: false,
});
