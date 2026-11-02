// Shiki transformer：解析代码块 meta，支持
//   ```js title="app.js" {2,5-7} wrap
// - title="…"  在代码块头部显示文件名
// - {1,3-5}    高亮指定行
// - wrap       长行自动换行（默认横向滚动）
// - nums       显示行号
// diff 语言会给 +/- 行加上 .diff-add / .diff-del。

/** @param {string} raw */
function parseMeta(raw) {
	const titleMatch = raw.match(/title=(?:"([^"]*)"|'([^']*)'|(\S+))/);
	const title = titleMatch ? (titleMatch[1] ?? titleMatch[2] ?? titleMatch[3]) : undefined;
	const rest = titleMatch ? raw.replace(titleMatch[0], '') : raw;

	const lines = new Set();
	for (const group of rest.matchAll(/\{([\d,\s-]+)\}/g)) {
		for (const part of group[1].split(',')) {
			const [a, b] = part.trim().split('-').map(Number);
			if (!Number.isFinite(a)) continue;
			const end = Number.isFinite(b) ? b : a;
			for (let i = a; i <= end && i - a < 1000; i++) lines.add(i);
		}
	}
	const flags = new Set(rest.replace(/\{[^}]*\}/g, ' ').split(/\s+/).filter(Boolean));
	return { title, lines, wrap: flags.has('wrap'), nums: flags.has('nums') };
}

/** @param {any} node */
function textOf(node) {
	if (node.type === 'text') return node.value;
	return (node.children ?? []).map(textOf).join('');
}

/** @param {any} node @param {string} cls */
function addClass(node, cls) {
	const current = node.properties.class;
	node.properties.class = current ? `${current} ${cls}` : cls;
}

/** @returns {import('shiki').ShikiTransformer} */
export function codeMetaTransformer() {
	return {
		name: 'cinnabar:code-meta',
		pre(node) {
			const meta = parseMeta(this.options.meta?.__raw ?? '');
			if (meta.title) node.properties['data-title'] = meta.title;
			if (meta.wrap) addClass(node, 'is-wrap');
			if (meta.nums) addClass(node, 'has-nums');
		},
		line(node, lineNumber) {
			const meta = parseMeta(this.options.meta?.__raw ?? '');
			if (meta.lines.has(lineNumber)) addClass(node, 'hl');
			if (this.options.lang === 'diff') {
				const first = textOf(node)[0];
				if (first === '+') addClass(node, 'diff-add');
				else if (first === '-') addClass(node, 'diff-del');
			}
		},
	};
}
