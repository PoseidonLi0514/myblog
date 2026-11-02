// 代码高亮主题：以 Kanagawa Lotus / Dragon 为底，按本站底色修正对比度。
//
// 原版 Lotus 设计给自己的米黄底，放在本站的纸色上，字符串、注释等颜色
// 对比度只有 3:1 左右。这里在构建时把每个前景色的亮度推到 ≥ 4.5:1（WCAG AA），
// 色相不变，所以整体观感仍是 Kanagawa。
import lotus from '@shikijs/themes/kanagawa-lotus';
import dragon from '@shikijs/themes/kanagawa-dragon';

// 与 src/styles/tokens.css 中的 --paper-2 保持一致
const LIGHT_BG = '#f0eadd';
const DARK_BG = '#1e1b17';
const TARGET = 4.6;

/** @param {string} hex */
const toRgb = (hex) => {
	const n = parseInt(hex.slice(1, 7), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/** @param {number[]} rgb */
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
/** @param {number[]} rgb */
const luminance = (rgb) =>
	rgb
		.map((v) => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
		.reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
/** @param {number[]} a @param {number[]} b */
const contrast = (a, b) => {
	const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
	return (x + 0.05) / (y + 0.05);
};

/** @param {number[]} rgb @returns {number[]} */
function toHsl([r, g, b]) {
	(r /= 255), (g /= 255), (b /= 255);
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return [0, 0, l];
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
	return [h / 6, s, l];
}

/** @param {number[]} hsl @returns {number[]} */
function fromHsl([h, s, l]) {
	if (s === 0) return [l * 255, l * 255, l * 255];
	/** @param {number} p @param {number} q @param {number} t */
	const f = (p, q, t) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	return [f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)].map((v) => v * 255);
}

/** 只改亮度，直到与背景的对比度达标 */
/** @param {string} hex @param {string} bgHex @param {'darken' | 'lighten'} dir */
function ensureContrast(hex, bgHex, dir) {
	const bg = toRgb(bgHex);
	let rgb = toRgb(hex);
	if (contrast(rgb, bg) >= TARGET) return hex;
	const [h, s, l0] = toHsl(rgb);
	for (let l = l0; l >= 0 && l <= 1; l += dir === 'darken' ? -0.005 : 0.005) {
		rgb = fromHsl([h, s, l]);
		if (contrast(rgb, bg) >= TARGET) break;
	}
	return toHex(rgb) + hex.slice(7); // 保留可能存在的透明度
}

/** @param {any} theme @param {string} name @param {string} bg @param {'darken' | 'lighten'} dir */
function tune(theme, name, bg, dir) {
	const fix = (/** @type {string} */ c) => (typeof c === 'string' && /^#[0-9a-f]{6}/i.test(c) ? ensureContrast(c, bg, dir) : c);
	return {
		...theme,
		name,
		colors: { ...theme.colors, 'editor.background': bg, 'editor.foreground': fix(theme.colors['editor.foreground']) },
		tokenColors: theme.tokenColors.map((/** @type {any} */ tc) =>
			tc.settings?.foreground ? { ...tc, settings: { ...tc.settings, foreground: fix(tc.settings.foreground) } } : tc,
		),
		semanticTokenColors: Object.fromEntries(
			Object.entries(theme.semanticTokenColors ?? {}).map(([k, v]) => [
				k,
				typeof v === 'string' ? fix(v) : v && typeof v === 'object' && 'foreground' in v ? { ...v, foreground: fix(v.foreground) } : v,
			]),
		),
	};
}

export const lightTheme = tune(lotus, 'cinnabar-lotus', LIGHT_BG, 'darken');
export const darkTheme = tune(dragon, 'cinnabar-dragon', DARK_BG, 'lighten');
