import esbuild from 'esbuild';

/**
 * @author tknight-dev
 */

esbuild.build({
	bundle: true,
	entryPoints: {
		index: 'src/index.ts',
	},
	loader: {},
	format: 'esm',
	metafile: false,
	minify: true,
	outdir: 'dist',
	outExtension: {
		'.js': '.mjs',
	},
	platform: 'node',
	plugins: [], // Don't set plugins here
	sourcemap: false,
});
