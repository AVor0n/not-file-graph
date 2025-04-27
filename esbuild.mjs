import * as esbuild from 'esbuild';

const production = process.argv[2] === '--production';

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				if (location) {
					console.error(`    ${location.file}:${location.line}:${location.column}:`);
				}
			});
			console.log('[watch] build finished');
		});
	},
};

/** @type {string[]} */
const external = [
	'vscode',
	// Исключаем ненужные зависимости
	'velocityjs',
	'dustjs-linkedin',
	'atpl',
	'liquor',
	'twig',
	'ejs',
	'eco',
	'jazz',
	'jqtpl',
	'hamljs',
	'hamlet',
	'whiskers',
	'haml-coffee',
	'hogan.js',
	'templayed',
	'handlebars',
	'underscore',
	'walrus',
	'mustache',
	'just',
	'ect',
	'mote',
	'toffee',
	'dot',
	'bracket-template',
	'ractive',
	'htmling',
	'babel-core',
	'plates',
	'vash',
	'slm',
	'marko',
	'teacup/lib/express',
	'coffee-script',
	'squirrelly',
	'twing',
	'@vue/compiler-sfc',
	'@vue/compiler-dom',
	'@vue/compiler-core',
	'@vue/compiler-ssr',
	'@vue/shared'
];

/** @type {import('esbuild').BuildOptions} */
const extensionConfig = {
	entryPoints: ['src/extension.ts'],
	bundle: true,
	outfile: 'dist/extension.js',
	external,
	format: 'cjs',
	platform: 'node',
	target: 'es2020',
	sourcemap: !production,
	minify: production,
	sourcesContent: false,
	logLevel: 'silent',
	plugins: [
		/* add to the end of plugins array */
		esbuildProblemMatcherPlugin,
	],
};

/** @type {import('esbuild').BuildOptions} */
const webviewConfig = {
	entryPoints: ['src/webview/index.tsx'],
	bundle: true,
	outfile: 'dist/webview/index.js',
	format: 'iife',
	platform: 'browser',
	target: 'es2020',
	sourcemap: !production,
	minify: production,
	loader: { '.tsx': 'tsx' },
	define: {
		'process.env.NODE_ENV': production ? '"production"' : '"development"'
	},
	external,
};

async function build() {
	try {
		const ctx = await esbuild.context({
			entryPoints: ['src/extension.ts', 'src/webview/index.tsx'],
			bundle: true,
			external: external,
			format: 'cjs',
			target: 'es2020',
			platform: 'node',
			outdir: 'dist',
			sourcemap: !production,
			minify: production,
		});

		await esbuild.build(extensionConfig);
		await esbuild.build(webviewConfig);
		console.log('Build completed successfully');
	} catch (error) {
		console.error('Build failed:', error);
		process.exit(1);
	}
}

if (process.argv[2] === '--watch') {
	const ctx = await esbuild.context(extensionConfig);
	const webviewCtx = await esbuild.context(webviewConfig);
	await Promise.all([ctx.watch(), webviewCtx.watch()]);
	console.log('Watching for changes...');
} else {
	build();
}
