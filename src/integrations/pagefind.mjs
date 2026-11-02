// Pagefind 集成：
// - astro build 结束后，为 dist/ 里带 data-pagefind-body 的页面（即文章）建索引，输出到 dist/pagefind/
// - astro dev 时，/pagefind/* 直接读取上一次构建留下的索引，所以开发时要先 build 一次才能搜索
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = {
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.wasm': 'application/wasm',
};

/** @returns {import('astro').AstroIntegration} */
export default function pagefind() {
	/** @type {string} */
	let outDir;

	return {
		name: 'cinnabar:pagefind',
		hooks: {
			'astro:config:done': ({ config }) => {
				outDir = fileURLToPath(config.outDir);
			},

			'astro:build:done': async ({ dir, logger }) => {
				const { createIndex, close } = await import('pagefind');
				const { index, errors } = await createIndex();
				if (!index) throw new Error(`Pagefind: ${errors.join('; ')}`);
				const added = await index.addDirectory({ path: fileURLToPath(dir) });
				if (added.errors.length) throw new Error(`Pagefind: ${added.errors.join('; ')}`);
				const written = await index.writeFiles({ outputPath: path.join(fileURLToPath(dir), 'pagefind') });
				if (written.errors.length) throw new Error(`Pagefind: ${written.errors.join('; ')}`);
				await close();
				logger.info(`已为 ${added.page_count} 个页面建立搜索索引`);
			},

			'astro:server:setup': ({ server }) => {
				const root = path.join(outDir, 'pagefind');
				server.middlewares.use('/pagefind', (req, res, next) => {
					const rel = decodeURIComponent((req.url ?? '/').split('?')[0]);
					const file = path.resolve(root, '.' + rel);
					if (!file.startsWith(root + path.sep) || !existsSync(file) || !statSync(file).isFile()) return next();
					res.setHeader('Content-Type', TYPES[/** @type {keyof typeof TYPES} */ (path.extname(file))] ?? 'application/octet-stream');
					res.setHeader('Cache-Control', 'no-cache');
					createReadStream(file).pipe(res);
				});
			},
		},
	};
}
