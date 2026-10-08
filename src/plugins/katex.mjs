import katex from 'katex';

// Sätteri 的 mdast 插件：开启 math 特性后，把解析出的公式节点在构建时用 KaTeX 渲染成 HTML。
// 插件就是普通对象（defineMdastPlugin 只用于类型推断），这样不用直接依赖 satteri 包。
/** @type {import('satteri').MdastPluginEntry} */
export const katexPlugin = {
	name: 'katex',
	inlineMath(node, ctx) {
		ctx.replaceNode(node, { raw: katex.renderToString(node.value, { throwOnError: false }) });
	},
	math(node, ctx) {
		ctx.replaceNode(node, {
			raw: katex.renderToString(node.value, { displayMode: true, throwOnError: false }),
		});
	},
};
