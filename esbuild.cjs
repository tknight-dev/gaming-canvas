esbuild = require('esbuild');

/**
 * @author tknight-dev
 */

esbuild.build({
	bundle: true,
	entryPoints: {
		grid: 'src/grid.ts',
		index: 'src/index.ts',
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
