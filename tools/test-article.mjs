const API = 'https://fides.186-246-11-81.sslip.io';

async function run(id) {
  const t = Date.now();
  const r = await fetch(`${API}/api/archive/ruscatholic/articles/${id}`);
  const ms = Date.now() - t;
  const text = await r.text();
  let j;
  try {
    j = JSON.parse(text);
  } catch {
    console.log({ id, status: r.status, ms, parseError: true, head: text.slice(0, 120) });
    return;
  }
  const a = j.article || j;
  const html = a.contentHtml || '';
  const re =
    /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>|<(p|h[1-6]|blockquote)\b[^>]*>([\s\S]*?)<\/\2>/gi;
  const blocks = [...html.matchAll(re)];
  console.log({
    id,
    status: r.status,
    ms,
    mode: j.mode,
    title: (a.title || '').slice(0, 50),
    htmlLen: html.length,
    blocks: blocks.length,
    p: (html.match(/<p\b/gi) || []).length,
  });
}

for (const id of [35743, 41904, 41929, 35749, 16257]) {
  await run(id);
}
