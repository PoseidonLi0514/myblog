// 从 zhang.png（1024×1024，米色纸上一方朱砂「札」印）生成站点用到的所有图标与印章图。
// 换了原图后重新运行：node scripts/make-icons.mjs
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'zhang.png');
const out = path.join(root, 'public');
mkdirSync(out, { recursive: true });

// ── 抠图：印外的纸变透明，印里的白字和斑驳保持原样，深浅色背景上都只露出印面 ──
const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, N = W * H;

// 纸色取四边，印泥色取明显偏红的像素
const paper = [0, 0, 0], ink = [0, 0, 0];
let np = 0, ni = 0;
for (let i = 0; i < N; i++) {
	const x = i % W, y = (i / W) | 0;
	const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
	if (x < 32 || y < 32 || x >= W - 32 || y >= H - 32) (paper[0] += r), (paper[1] += g), (paper[2] += b), np++;
	if (r - g > 120) (ink[0] += r), (ink[1] += g), (ink[2] += b), ni++;
}
for (let k = 0; k < 3; k++) (paper[k] /= np), (ink[k] = Math.round(ink[k] / ni));

// 纸和印泥在绿色通道上差得最多（约 240 对 53），按它算每个像素的印泥量：0 是纸，1 是实打实的印泥
const t = new Float32Array(N);
for (let i = 0; i < N; i++) t[i] = Math.min(1, Math.max(0, (paper[1] - data[i * 3 + 1]) / (paper[1] - ink[1])));

// 从四边往里漫：不穿过印泥就能连到外面的，是印外的纸；被印泥围住的白字和斑点不算
const outside = new Uint8Array(N);
const stack = [];
for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
while (stack.length) {
	const i = stack.pop();
	if (outside[i] || t[i] >= 0.5) continue;
	outside[i] = 1;
	const x = i % W;
	if (x > 0) stack.push(i - 1);
	if (x < W - 1) stack.push(i + 1);
	if (i >= W) stack.push(i - W);
	if (i < N - W) stack.push(i + W);
}

// 印外向里 3px 是半纸半泥的毛边，这一圈只保留印泥色，浓淡交给不透明度，放在深色底上才不会泛白边
const R = 3;
const band = new Uint8Array(N), edge = new Uint8Array(N);
for (let i = 0; i < N; i++) {
	if (!outside[i]) continue;
	const x = i % W, row = i - x;
	for (let d = Math.max(0, x - R); d <= Math.min(W - 1, x + R); d++) band[row + d] = 1;
}
for (let i = 0; i < N; i++) {
	if (!band[i]) continue;
	const x = i % W, y = (i / W) | 0;
	for (let d = Math.max(0, y - R); d <= Math.min(H - 1, y + R); d++) edge[d * W + x] = 1;
}

const smooth = (v) => {
	const u = Math.min(1, Math.max(0, (v - 0.15) / 0.7));
	return u * u * (3 - 2 * u);
};
const rgba = Buffer.alloc(N * 4);
let x0 = W, y0 = H, x1 = -1, y1 = -1;
for (let i = 0; i < N; i++) {
	const o = i * 4, s = i * 3;
	const a = edge[i] ? Math.round(255 * smooth(t[i])) : 255;
	const c = edge[i] ? ink : [data[s], data[s + 1], data[s + 2]];
	(rgba[o] = c[0]), (rgba[o + 1] = c[1]), (rgba[o + 2] = c[2]), (rgba[o + 3] = a);
	if (a > 8) {
		const x = i % W, y = (i / W) | 0;
		(x0 = Math.min(x0, x)), (y0 = Math.min(y0, y)), (x1 = Math.max(x1, x)), (y1 = Math.max(y1, y));
	}
}

// 裁到印面，补成正方形
const w = x1 - x0 + 1, h = y1 - y0 + 1, side = Math.max(w, h);
const master = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
	.extract({ left: x0, top: y0, width: w, height: h })
	.extend({
		top: (side - h) >> 1,
		bottom: side - h - ((side - h) >> 1),
		left: (side - w) >> 1,
		right: side - w - ((side - w) >> 1),
		background: { r: 0, g: 0, b: 0, alpha: 0 },
	})
	.png()
	.toBuffer();

const base = (size) => sharp(master).resize(size, size, { kernel: 'lanczos3' });
const plain = (size) => base(size).png({ compressionLevel: 9 }).toBuffer();
// 较大的用调色板量化，印拓纹理几乎看不出差别，体积小一大截
const palette = (img) => img.png({ palette: true, quality: 90, colours: 128, effort: 10 }).toBuffer();

// ICO 容器里直接放 PNG 数据，所有现代浏览器都认
const ico = (images) => {
	const head = Buffer.alloc(6);
	head.writeUInt16LE(1, 2);
	head.writeUInt16LE(images.length, 4);
	let offset = 6 + 16 * images.length;
	const dir = images.map(({ size, buf }) => {
		const e = Buffer.alloc(16);
		e[0] = e[1] = size >= 256 ? 0 : size;
		e.writeUInt16LE(1, 4);
		e.writeUInt16LE(32, 6);
		e.writeUInt32LE(buf.length, 8);
		e.writeUInt32LE(offset, 12);
		offset += buf.length;
		return e;
	});
	return Buffer.concat([head, ...dir, ...images.map((i) => i.buf)]);
};

const files = {};
// 这方印没有内框，裁到印面后 16、32px 也认得出，不用再额外裁边
files['favicon.ico'] = ico([
	{ size: 16, buf: await plain(16) },
	{ size: 32, buf: await plain(32) },
	{ size: 48, buf: await plain(48) },
]);
files['icon-192.png'] = await palette(base(192));
// iOS 会把透明处填成黑色，主屏图标直接用带纸底的原图
files['apple-touch-icon.png'] = await palette(sharp(src).resize(180, 180, { kernel: 'lanczos3' }).removeAlpha());
// 页面里的印章：最大约 48px，按 3 倍屏留余量，192px 足够
files['seal.webp'] = await base(192).webp({ quality: 82, effort: 6 }).toBuffer();

for (const [name, buf] of Object.entries(files)) {
	writeFileSync(path.join(out, name), buf);
	console.log(`public/${name}  ${(buf.length / 1024).toFixed(1)} KB`);
}
