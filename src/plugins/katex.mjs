import katex from 'katex';

// Sätteri 的 mdast 插件：开启 math 特性后，把解析出的公式节点在构建时用 KaTeX 渲染成 HTML。
// 与原博客 myblog/src/plugins/katex.mjs 相同，迁移时可直接沿用。
/** @type {import('satteri').MdastPluginEntry} */
export const katexPlugin = {
	name: 'katex',
	inlineMath(node, ctx) {
		// 行内公式要输出成行内的 html 节点：{ raw } 会被当作 Markdown 重新解析，放进段落里会再生出一个 <p>
		const html = katex.renderToString(node.value, { throwOnError: false });
		ctx.replaceNode(node, { type: 'html', value: html });
	},
	math(node, ctx) {
		const html = katex.renderToString(node.value, { displayMode: true, throwOnError: false });
		// 包一层可横向滚动的容器，长公式在手机上不会撑破版面
		ctx.replaceNode(node, { raw: `<div class="math-block" tabindex="0">${html}</div>` });
	},
};
