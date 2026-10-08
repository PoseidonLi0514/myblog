// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import { katexPlugin } from './src/plugins/katex.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.marvinleee.com',
	integrations: [mdx()],
	markdown: {
		processor: satteri({
			features: { math: true },
			mdastPlugins: [katexPlugin],
		}),
	},
});
