// Sätteri 的 hast 插件：在构建时给正文加上主题需要的结构，不依赖客户端脚本。
//
// - 代码块：包一层 .code-block，带文件名 / 语言标签 / 复制按钮
// - 表格：包一层可横向滚动的 .table-wrap
// - 标题：生成 id（与 Astro 内置规则一致）并附上锚点链接
// - GitHub 风格提示块：> [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]
// - 带 title 的独立图片：![说明](src "图注") → <figure> + <figcaption>
// - 外部链接：加 .external
// - 脚注标题：去掉 sr-only，显示出来
import GithubSlugger from 'github-slugger';

const CALLOUTS = {
	note: '备注',
	tip: '提示',
	important: '重要',
	warning: '注意',
	caution: '警告',
};

const SITE_HOST = 'blog.marvinleee.com';

/** @param {any} node */
function classList(node) {
	const p = node.properties ?? {};
	const raw = p.className ?? p.class ?? [];
	return Array.isArray(raw) ? raw.map(String) : String(raw).split(/\s+/).filter(Boolean);
}

/** @param {any} node @param {string} key camelCase 形式，例如 dataLanguage */
function prop(node, key) {
	const p = node.properties ?? {};
	const kebab = key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
	return p[key] ?? p[kebab];
}

/** @param {string} tagName @param {Record<string, unknown>} properties @param {any[]} [children] */
const h = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });
/** @param {string} value */
const t = (value) => ({ type: 'text', value });

/** 把访问器给的节点（可能带内部字段）复制成普通 hast 对象 */
/** @param {any} node @returns {any} */
function plain(node) {
	if (node.type === 'text' || node.type === 'raw' || node.type === 'comment') {
		return { type: node.type, value: node.value };
	}
	return {
		type: node.type,
		tagName: node.tagName,
		properties: { ...(node.properties ?? {}) },
		children: (node.children ?? []).map(plain),
	};
}

/** @type {import('satteri').HastPluginEntry} */
export const prosePlugin = () => {
	const slugger = new GithubSlugger();

	return {
		name: 'cinnabar:prose',
		element: [
			{
				filter: ['pre'],
				visit(node, ctx) {
					if (!classList(node).includes('astro-code')) return;
					const lang = String(prop(node, 'dataLanguage') ?? 'plaintext');
					const title = prop(node, 'dataTitle');
					const label = lang === 'plaintext' || lang === 'text' || lang === 'txt' ? '' : lang;

					const head = h('div', { className: ['code-head'], dataPagefindIgnore: '' }, [
						title ? h('span', { className: ['code-title'] }, [t(String(title))]) : null,
						label ? h('span', { className: ['code-lang'] }, [t(label)]) : null,
						h('button', { type: 'button', className: ['code-copy'], dataCopy: '' }, [t('复制')]),
					].filter(Boolean));

					// 头部放在 <pre> 之前，保证键盘与读屏顺序和视觉一致
					ctx.replaceNode(node, h('div', { className: ['code-block'], dataLang: lang }, [head, plain(node)]));
				},
			},
			{
				filter: ['table'],
				visit(node, ctx) {
					ctx.wrapNode(node, h('div', { className: ['table-wrap'], tabIndex: 0 }));
				},
			},
			{
				filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
				visit(node, ctx) {
					const existing = prop(node, 'id');
					if (existing === 'footnote-label') {
						ctx.setProperty(node, 'className', ['footnotes-title']);
						return;
					}
					const id = typeof existing === 'string' ? existing : slugger.slug(ctx.textContent(node));
					if (typeof existing !== 'string') ctx.setProperty(node, 'id', id);
					ctx.appendChild(
						node,
						h('a', { className: ['heading-anchor'], href: `#${id}`, ariaLabel: '本节链接' }),
					);
				},
			},
			{
				filter: ['blockquote'],
				visit(node, ctx) {
					const firstP = (node.children ?? []).find((c) => c.type === 'element' && c.tagName === 'p');
					const first = firstP?.children?.[0];
					if (!firstP || first?.type !== 'text') return;
					const m = first.value.match(/^\s*\[!(note|tip|important|warning|caution)\][ \t]*\n?/i);
					if (!m) return;

					const type = m[1].toLowerCase();
					const rest = first.value.slice(m[0].length);
					const remaining = [...(rest ? [t(rest)] : []), ...firstP.children.slice(1).map(plain)];

					ctx.setProperty(node, 'className', ['callout', `callout-${type}`]);
					if (remaining.length) ctx.replaceNode(firstP, h('p', {}, remaining));
					else ctx.removeNode(firstP);
					ctx.prependChild(
						node,
						h('p', { className: ['callout-title'] }, [
							h('span', { className: ['callout-mark'], ariaHidden: 'true' }),
							t(CALLOUTS[/** @type {keyof typeof CALLOUTS} */ (type)]),
						]),
					);
				},
			},
			{
				filter: ['p'],
				visit(node, ctx) {
					const kids = (node.children ?? []).filter((c) => !(c.type === 'text' && !c.value.trim()));
					const img = kids[0];
					if (kids.length !== 1 || img.type !== 'element' || img.tagName !== 'img') return;
					const caption = prop(img, 'title');
					if (!caption) return;
					const { title: _drop, ...imgProps } = img.properties ?? {};
					ctx.replaceNode(
						node,
						h('figure', {}, [
							h('img', { ...imgProps, loading: 'lazy', decoding: 'async' }),
							h('figcaption', {}, [t(String(caption))]),
						]),
					);
				},
			},
			{
				filter: ['a'],
				visit(node, ctx) {
					const href = prop(node, 'href');
					if (typeof href !== 'string' || !/^https?:\/\//i.test(href)) return;
					try {
						if (new URL(href).host === SITE_HOST) return;
					} catch {
						return;
					}
					ctx.setProperty(node, 'className', [...classList(node), 'external']);
				},
			},
		],
	};
};
