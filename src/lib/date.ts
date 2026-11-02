// 日期统一按 UTC 取值：frontmatter 里的 2026-10-08 会被解析成 UTC 零点，
// 用本地时区格式化可能在构建机上变成前一天。
const pad = (n: number) => String(n).padStart(2, '0');

/** 2026-10-08 */
export function isoDate(d: Date): string {
	return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** 2026 年 10 月 8 日 */
export function longDate(d: Date): string {
	return `${d.getUTCFullYear()} 年 ${d.getUTCMonth() + 1} 月 ${d.getUTCDate()} 日`;
}

/** 10-08 */
export function shortDate(d: Date): string {
	return `${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** 2026.10.08 */
export function dotDate(d: Date): string {
	return `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())}`;
}
