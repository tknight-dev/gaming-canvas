esbuild = require('esbuild');

/**
 * @author tknight-dev
 */

esbuild.build({
	bundle: true,
	entryPoints: {
		'module-grid-index': 'src/modules/grid/index.ts',
		index: 'src/main/index.ts',
	},
	loader: {},
	format: 'cjs',
	// mangleProps: /^[_#]/, // Breaks property references when sending between WebWorkers
	mangleQuoted: true,
	metafile: true,
	minify: true,
	outdir: 'dist',
	outExtension: {
		'.js': '.cjs',
	},
	platform: 'node',
	plugins: [], // Don't set plugins here
	sourcemap: true,
	treeShaking: true,
});
