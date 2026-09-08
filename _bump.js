/* Обновляет YAK_BUILD во всех html, sw.js и build.json (кэш-бастинг). */
const fs = require('fs');
const path = require('path');

const d = new Date();
const p = (n) => String(n).padStart(2, '0');
const build =
  d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + p(d.getHours()) + p(d.getMinutes());

const dir = __dirname;
let touched = 0;

for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.html')) continue;
  const file = path.join(dir, f);
  const src = fs.readFileSync(file, 'utf8');
  const out = src
    .replace(/(window\.YAK_BUILD\s*=\s*')\d+(')/g, '$1' + build + '$2')
    .replace(/(\?v=)\d{8,}/g, '$1' + build);
  if (out !== src) {
    fs.writeFileSync(file, out);
    touched++;
  }
}

const sw = path.join(dir, 'sw.js');
if (fs.existsSync(sw)) {
  const src = fs.readFileSync(sw, 'utf8');
  const out = src.replace(/(var BUILD\s*=\s*')\d+(')/, '$1' + build + '$2');
  if (out !== src) {
    fs.writeFileSync(sw, out);
    touched++;
  }
}

fs.writeFileSync(path.join(dir, 'build.json'), JSON.stringify({ id: build }, null, 2) + '\n');
console.log('BUILD', build, 'files', touched + 1);
