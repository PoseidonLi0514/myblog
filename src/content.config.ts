import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { site } from './site.config';

const categoryNames = site.categories.map((c) => c.name) as unknown as [string, ...string[]];

// 前四个字段与原博客一致，旧文章无需改动即可迁移；其余字段都是可选的。
// 没写 category 的文章不属于任何分类，只出现在"全部"里。
const posts = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		description: z.string().optional(),
		tags: z.array(z.string()).default([]),
		/** 分类，只能是 site.config.ts 里定义过的名字 */
		category: z.enum(categoryNames).optional(),
		/** 最后更新日期，显示在文章头部 */
		updated: z.coerce.date().optional(),
		/** 草稿：开发时可见，构建时排除 */
		draft: z.boolean().default(false),
		/** 设为 false 关闭目录 */
		toc: z.boolean().default(true),
		/** 文章语言，英文文章写 en，会换用整篇衬线排版 */
		lang: z.string().optional(),
	}),
});

export const collections = { posts };
