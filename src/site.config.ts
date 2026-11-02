// 站点信息集中在这里，改这一个文件即可。
export const site = {
	title: 'Marvin Lee',
	description: '关于安全、代码与思考的笔记。',
	author: 'Marvin Lee',
	lang: 'zh-CN',
	/** 首页开头那段话 */
	intro: {
		heading: ['把想清楚的事', '写下来。'],
		body: '我是 Marvin，在这里记录安全研究、编程，以及一路上想明白的东西。文章不追求多，力求每一篇都经得起回头再读。',
	},
	nav: [
		{ href: '/posts/', label: '文章' },
		{ href: '/tags/', label: '标签' },
		{ href: '/about/', label: '关于' },
	],
	/** 个人链接：显示在首页简介下方和页脚，按需增删 */
	links: [
		{ href: 'https://github.com/PoseidonLi0514', label: 'GitHub' },
		{ href: 'mailto:adehcby@gmail.com', label: 'Email' },
		{ href: '/rss.xml', label: 'RSS' },
	],
	/** 首页显示的文章数量 */
	homePosts: 6,
	/**
	 * 分类：每篇文章最多属于一个，在 frontmatter 里写 category: 周报。
	 * 侧栏按这里的顺序排列；slug 是网址，用英文；写错分类名会在构建时报错。
	 */
	categories: [
		{ name: '技术', slug: 'tech', description: '安全研究、编程，以及排查问题的过程。' },
		{ name: '周报', slug: 'weekly', description: '每周做了什么，读了什么，接下来打算做什么。' },
		{ name: '杂谈', slug: 'misc', description: '不成体系的想法，和关于这个博客本身的事。' },
	],
} as const;
