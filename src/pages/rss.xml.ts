import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { excerpt, postUrl } from '../lib/posts';
import { site } from '../site.config';

export async function GET(context: APIContext) {
	// RSS 永远不含草稿，即使在开发模式下
	const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
		(a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
	);

	return rss({
		title: site.title,
		description: site.description,
		site: context.site!,
		items: posts.map((post) => ({
			title: post.data.title,
			pubDate: post.data.date,
			description: post.data.description ?? excerpt(post.body, 200),
			link: postUrl(post),
			categories: [...(post.data.category ? [post.data.category] : []), ...post.data.tags],
		})),
		customData: `<language>${site.lang.toLowerCase()}</language>`,
	});
}
