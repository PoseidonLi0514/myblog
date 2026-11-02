// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { katexPlugin } from './src/plugins/katex.mjs';
import { prosePlugin } from './src/plugins/prose.mjs';
import { codeMetaTransformer } from './src/plugins/code-meta.mjs';
import { lightTheme, darkTheme } from './src/plugins/code-themes.mjs';
import pagefind from './src/integrations/pagefind.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.marvinleee.com',
	trailingSlash: 'ignore',
	// /categories/ 没有单独页面，分类在侧栏里
	redirects: { '/categories': '/posts/' },
	integrations: [mdx(), sitemap(), pagefind()], // pagefind 放在最后：等其他集成写完 dist/ 再建索引
	markdown: {
		shikiConfig: {
			// 两套主题输出为 CSS 变量，由 [data-theme] 切换，见 src/styles/code.css
			// 主题基于 Kanagawa，按本站底色修正了对比度，见 src/plugins/code-themes.mjs
			themes: { light: lightTheme, dark: darkTheme },
			defaultColor: false,
			transformers: [codeMetaTransformer()],
		},
		processor: satteri({
			features: {
				math: true,
				gfm: {
					footnotes: { label: '注释', backLabel: '返回正文 {reference}' },
				},
			},
			mdastPlugins: [katexPlugin],
			hastPlugins: [prosePlugin],
		}),
	},
});
