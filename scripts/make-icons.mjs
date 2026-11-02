// 从 fav.png（1024×1024 朱砂印拓）生成站点用到的所有图标与印章图。
// 换了原图后重新运行：node scripts/make-icons.mjs
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'fav.png');
const out = path.join(root, 'public');
mkdirSync(out, { recursive: true });

const base = (size) => sharp(src).resize(size, size, { kernel: 'lanczos3' });
// 小尺寸直接存 PNG；较大的用调色板量化，印拓纹理几乎看不出差别，体积小一大截
const plain = (size) => base(size).png({ compressionLevel: 9 }).toBuffer();
const palette = (size) => base(size).png({ palette: true, quality: 90, colours: 128, effort: 10 }).toBuffer();

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
// 16、32px 时外框和对角线会糊成一团：裁掉外圈让字更大；48px 保留完整的印
const crop = (size) => sharp(src).extract({ left: 56, top: 56, width: 912, height: 912 }).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toBuffer();
files['favicon.ico'] = ico([
  { size: 16, buf: await crop(16) },
  { size: 32, buf: await crop(32) },
  { size: 48, buf: await plain(48) },
]);
files['icon-192.png'] = await palette(192);
files['apple-touch-icon.png'] = await palette(180);
// 页面里的印章：最大约 48px，按 3 倍屏留余量，192px 足够
files['seal.webp'] = await base(192).webp({ quality: 82, effort: 6 }).toBuffer();

for (const [name, buf] of Object.entries(files)) {
  writeFileSync(path.join(out, name), buf);
  console.log(`public/${name}  ${(buf.length / 1024).toFixed(1)} KB`);
}
