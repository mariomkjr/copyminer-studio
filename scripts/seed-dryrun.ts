/**
 * Dry-run do parser de COPIES-USADAS.md — só conta e mostra amostra, não conecta Supabase.
 * Uso: npx tsx scripts/seed-dryrun.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const SKILL_DIR = '/Users/mk/LogicaOS/skills/copyminer-fe/data';

function parseCopiesMd() {
  const file = path.join(SKILL_DIR, 'COPIES-USADAS.md');
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const rows: any[] = [];
  let skipped = 0;
  for (const ln of lines) {
    if (!ln.startsWith('| V')) continue;
    const parts = ln.split('|').map(s => s.trim());
    if (parts.length < 7) { skipped++; continue; }
    const id = parts[1];
    const date = parts[2] && /^\d{4}-\d{2}-\d{2}$/.test(parts[2]) ? parts[2] : null;
    const monte = parts[3]?.match(/MONTE\d+/)?.[0] || null;
    const temaRaw = parts[4];
    let formato: string | null = null;
    let tema = temaRaw;
    const fm = temaRaw?.match(/^\[([a-z_]+)\]\s*(.*)$/);
    if (fm) { formato = fm[1]; tema = fm[2]; }
    const p1 = parts[5]?.replace(/^"|"$/g, '').trim();
    const p2 = parts[6]?.replace(/^"|"$/g, '').trim();
    if (!id || !p1 || !p2) { skipped++; continue; }
    rows.push({ video_id: id, batch_date: date, monte, tema, formato, p1_copy: p1, p2_copy: p2 });
  }
  return { rows, skipped };
}

const { rows, skipped } = parseCopiesMd();
console.log(`Total parsed: ${rows.length}`);
console.log(`Skipped: ${skipped}`);
console.log(`Unique video_ids: ${new Set(rows.map(r => r.video_id)).size}`);
console.log(`Formatos encontrados: ${[...new Set(rows.map(r => r.formato).filter(Boolean))].join(', ')}`);
console.log(`MONTES distintos: ${[...new Set(rows.map(r => r.monte).filter(Boolean))].sort().join(', ')}`);
console.log(`\nPrimeiras 2 entries:`);
console.log(JSON.stringify(rows.slice(0, 2), null, 2));
console.log(`\nÚltimas 2 entries:`);
console.log(JSON.stringify(rows.slice(-2), null, 2));
