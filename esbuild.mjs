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
	mangleProps: /^[_#]/,
	mangleQuoted: true,
	metafile: true,
	minify: true,
	outdir: 'dist',
	outExtension: {
		'.js': '.mjs',
	},
	platform: 'node',
	plugins: [], // Don't set plugins here
	sourcemap: true,
	treeShaking: true,
});
