import { getCollection, type CollectionEntry } from 'astro:content';
import { site } from '../site.config';

export type Post = CollectionEntry<'posts'>;

/** 所有已发布文章，按日期从新到旧。开发模式下包含草稿。 */
export async function getPosts(): Promise<Post[]> {
	const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
	return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function postUrl(post: Post): string {
	return `/posts/${post.id}/`;
}

/** 标签 → URL 片段。保留中文，空格变连字符。 */
export function tagSlug(tag: string): string {
	return tag
		.trim()
		.toLowerCase()
		.replace(/[\s_]+/g, '-')
		.replace(/[/?#%\\]+/g, '-');
}

export function tagUrl(tag: string): string {
	return `/tags/${tagSlug(tag)}/`;
}

export interface TagInfo {
	name: string;
	slug: string;
	posts: Post[];
}

/** 汇总所有标签，按文章数从多到少，其次按名称。 */
export function collectTags(posts: Post[]): TagInfo[] {
	const map = new Map<string, TagInfo>();
	for (const post of posts) {
		for (const name of post.data.tags) {
			const slug = tagSlug(name);
			const entry = map.get(slug) ?? { name, slug, posts: [] };
			entry.posts.push(post);
			map.set(slug, entry);
		}
	}
	return [...map.values()].sort(
		(a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name, 'zh-CN'),
	);
}

export type Category = (typeof site.categories)[number];

export function categoryOf(post: Post): Category | undefined {
	return site.categories.find((c) => c.name === post.data.category);
}

export function categoryUrl(category: Category): string {
	return `/categories/${category.slug}/`;
}

export interface CategoryInfo {
	category: Category;
	posts: Post[];
}

/** 有文章的分类，按 site.config.ts 中的顺序。 */
export function collectCategories(posts: Post[]): CategoryInfo[] {
	return site.categories
		.map((category) => ({ category, posts: posts.filter((p) => p.data.category === category.name) }))
		.filter((c) => c.posts.length > 0);
}

/** 按年份分组，年份从新到旧。 */
export function groupByYear(posts: Post[]): [number, Post[]][] {
	const groups = new Map<number, Post[]>();
	for (const post of posts) {
		const year = post.data.date.getUTCFullYear();
		groups.set(year, [...(groups.get(year) ?? []), post]);
	}
	return [...groups.entries()].sort((a, b) => b[0] - a[0]);
}

/** 统计字数与阅读时间。中文按字、英文按词，代码块单独计行。 */
export function readingStats(body = '') {
	const codeBlocks = body.match(/```[\s\S]*?```/g) ?? [];
	const codeLines = codeBlocks.reduce((n, block) => n + block.split('\n').length - 2, 0);
	const text = body
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`[^`]*`/g, ' ')
		.replace(/\$\$[\s\S]*?\$\$/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/<[^>]+>/g, ' ');
	const cjk = text.match(/[㐀-鿿豈-﫿]/g)?.length ?? 0;
	const words = text.replace(/[㐀-鿿豈-﫿]/g, ' ').match(/[A-Za-z0-9][\w'-]*/g)?.length ?? 0;
	const minutes = Math.max(1, Math.round(cjk / 400 + words / 220 + codeLines / 40));
	return { words: cjk + words, minutes };
}

/** 从正文生成纯文本摘要，用于没有 description 的文章。 */
export function excerpt(body = '', length = 120): string {
	const text = body
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/\$\$[\s\S]*?\$\$/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
		.replace(/[*_`~]|<[^>]+>|\[\^[^\]]+\]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	return text.length > length ? text.slice(0, length).trimEnd() + '…' : text;
}
