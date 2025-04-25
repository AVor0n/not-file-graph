import * as esbuild from 'esbuild';
import * as path from 'path';

const isProduction = process.argv.includes('--production');
const isWatch = process.argv.includes('--watch');

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
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

const extensionConfig = {
	entryPoints: ['src/extension.ts'],
	bundle: true,
	outfile: 'dist/extension.js',
	external: ['vscode'],
	format: 'cjs',
	platform: 'node',
	target: 'node16',
	sourcemap: !isProduction,
	minify: isProduction,
	sourcesContent: false,
	logLevel: 'silent',
	plugins: [
		/* add to the end of plugins array */
		esbuildProblemMatcherPlugin,
	],
};

const webviewConfig = {
	entryPoints: ['src/webview/index.tsx'],
	bundle: true,
	outfile: 'dist/webview/index.js',
	format: 'iife',
	platform: 'browser',
	target: 'es2020',
	sourcemap: !isProduction,
	minify: isProduction,
	loader: { '.tsx': 'tsx' },
	define: {
		'process.env.NODE_ENV': isProduction ? '"production"' : '"development"'
	}
};

async function build() {
	try {
		await esbuild.build(extensionConfig);
		await esbuild.build(webviewConfig);
		console.log('Build completed successfully');
	} catch (error) {
		console.error('Build failed:', error);
		process.exit(1);
	}
}

if (isWatch) {
	const extensionContext = await esbuild.context(extensionConfig);
	const webviewContext = await esbuild.context(webviewConfig);

	await extensionContext.watch();
	await webviewContext.watch();
	console.log('Watching for changes...');
} else {
	build();
}
