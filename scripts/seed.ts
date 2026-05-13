/**
 * Seed inicial — popula formatos, montes, psychology_hooks, copies.
 * Lê arquivos da skill copyminer-fé no LogicaOS (read-only).
 *
 * Uso: npx tsx scripts/seed.ts
 * Requer: SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL em .env.local
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
// Polyfill WebSocket pro Supabase realtime client em Node 20
import ws from 'ws';
// @ts-expect-error global hack
globalThis.WebSocket = ws;
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const SKILL_DIR = '/Users/mk/LogicaOS/skills/copyminer-fe/data';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Faltam vars SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}
const supa = createClient(url, serviceKey, { auth: { persistSession: false } });

// ============ FORMATOS ============
async function seedFormatos() {
  const formatos = [
    {
      slug: 'bencao_pessoal',
      name: 'Bênção pessoal',
      description: 'Pai validando dor invisível + presença + profecia com prazo + CTA.',
      gatilho: 'Validação invisível: "Eu vi/Eu sei". Cria sensação de ser conhecido por Deus.',
      when_to_use: 'Default 70% dos vídeos. Funciona em qualquer tema (sofrimento, esperança, gratidão).',
      when_not_to_use: 'Nunca repetir a mesma copy. Máx 1 MONTE por tema.',
      target_percent: 70,
      display_order: 1,
    },
    {
      slug: 'curiosidade_revelada',
      name: 'Curiosidade revelada',
      description: 'P1 abre uma lacuna íntima ("Tem uma coisa…"), P2 revela com autoridade divina.',
      gatilho: 'Loop aberto + autoridade — só Ele tem a verdade pra fechar o loop.',
      when_to_use: '~8% dos vídeos. Bom pra temas onde tem segredo de Deus a revelar (cura, livramento, promessa).',
      when_not_to_use: 'NUNCA criar lacuna sem entregar revelação no P2. NÃO usar tom misterioso/oculto (filtro Veo).',
      target_percent: 8,
      display_order: 2,
    },
    {
      slug: 'pergunta_paternal',
      name: 'Pergunta paternal',
      description: 'Pai faz pergunta retórica que convida introspecção e gera comentário.',
      gatilho: 'Instinto de resposta — cérebro formula resposta automaticamente.',
      when_to_use: '~8% dos vídeos. Bom pra reativar fé de quem se distanciou.',
      when_not_to_use: 'NÃO cobrar ("Por que ainda não orou?"). NÃO cinismo. Sempre retórica paternal.',
      target_percent: 8,
      display_order: 3,
    },
    {
      slug: 'lista_profetica',
      name: 'Lista profética',
      description: '"Tem 3 coisas que Eu tô fazendo agora…" — máximo 3 itens, profecia condensada.',
      gatilho: 'Estruturado/numerado quebra o scroll. Cérebro adora listas curtas.',
      when_to_use: '~7%. Bom pra prometer múltiplas bênçãos simultâneas (3 portas, 3 livramentos, etc).',
      when_not_to_use: 'MÁXIMO 3 itens. Evitar "X passos pra agradar Deus" (vira ensinamento, perde o tom paternal).',
      target_percent: 7,
      display_order: 4,
    },
    {
      slug: 'negacao_amorosa',
      name: 'Negação amorosa',
      description: '"Pare de [X]. Hoje só [Y]." — reposiciona com amor, oferece alternativa.',
      gatilho: 'Pattern interrupt + autoridade — direciona sem agredir.',
      when_to_use: '~5%. Bom pra quebrar padrões de ansiedade, controle, comparação.',
      when_not_to_use: 'NÃO agressão. Sempre oferecer alternativa positiva. Tom firme mas amoroso.',
      target_percent: 5,
      display_order: 5,
    },
    {
      slug: 'identificacao_inversa',
      name: 'Identificação inversa',
      description: '"Quando você [gesto pequeno], Eu [resposta divina]" — POV invertido do céu pra terra.',
      gatilho: 'Validação retroativa + recompensa proporcional ao gesto invisível.',
      when_to_use: '~2%. Alto impacto, dilui se repetir muito. Usar com moderação.',
      when_not_to_use: 'NÃO inventar gesto irreal. Sempre verbo no passado seguido de consequência divina.',
      target_percent: 2,
      display_order: 6,
    },
  ];
  const { error } = await supa.from('formatos').upsert(formatos, { onConflict: 'slug' });
  if (error) throw error;
  console.log(`✓ formatos: ${formatos.length}`);
}

// ============ MONTES ============
async function seedMontes() {
  const montes = ['01','03','04','05','06','07','08','09','10','11','13'].map(n => ({
    name: `MONTE${n}`,
    active: true,
    description: 'Avatar "Pai" gerado via Nano Banana Pro no Flow. 9:16 vertical.',
  }));
  const { error } = await supa.from('montes').upsert(montes, { onConflict: 'name' });
  if (error) throw error;
  console.log(`✓ montes: ${montes.length}`);
}

// ============ PSYCHOLOGY (50 hooks) ============
async function seedPsychology() {
  const file = path.join(SKILL_DIR, '50-hooks-psicologia-bencao.md');
  const text = fs.readFileSync(file, 'utf8');
  // Pega seções "## NN — Título"
  const re = /^## (\d{2}) — ([^\n]+)\n([\s\S]*?)(?=^## |\Z)/gm;
  const items: any[] = [];
  let m: RegExpExecArray | null;
  let order = 1;
  while ((m = re.exec(text)) !== null) {
    const num = m[1];
    const titulo = m[2].replace(/✨\s*NOVO\s*$/, '').trim();
    const body = m[3].trim();
    items.push({
      categoria: `${num} — ${titulo}`,
      gatilho: titulo,
      rationale: body.slice(0, 2000),
      templates: [],
      display_order: order++,
    });
  }
  if (items.length === 0) {
    console.warn('Nenhuma seção encontrada em 50-hooks-psicologia-bencao.md');
    return;
  }
  // Limpa antes de inserir (idempotente)
  await supa.from('psychology_hooks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error } = await supa.from('psychology_hooks').insert(items);
  if (error) throw error;
  console.log(`✓ psychology_hooks: ${items.length}`);
}

// ============ COPIES (V8-XX) ============
function parseCopiesMd(): Array<{ video_id: string; batch_date: string | null; monte: string | null; tema: string | null; p1_copy: string; p2_copy: string; formato: string | null }> {
  const file = path.join(SKILL_DIR, 'COPIES-USADAS.md');
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const rows: any[] = [];
  for (const ln of lines) {
    // Match linhas: | V8-XX | DATE | MONTE | tema | "p1" | "p2" |
    if (!ln.startsWith('| V')) continue;
    // Split na barra
    const parts = ln.split('|').map(s => s.trim());
    // parts[0]='', parts[1]=ID, parts[2]=date, parts[3]=monte, parts[4]=tema_or_format, parts[5]=p1, parts[6]=p2, parts[7]=''
    if (parts.length < 7) continue;
    const id = parts[1];
    const date = parts[2] && /^\d{4}-\d{2}-\d{2}$/.test(parts[2]) ? parts[2] : null;
    const monte = parts[3]?.match(/MONTE\d+/)?.[0] || null;
    const temaRaw = parts[4];
    // Tema pode ter prefixo [formato] no início
    let formato: string | null = null;
    let tema = temaRaw;
    const fm = temaRaw?.match(/^\[([a-z_]+)\]\s*(.*)$/);
    if (fm) { formato = fm[1]; tema = fm[2]; }
    let p1 = parts[5]?.replace(/^"|"$/g, '').trim();
    let p2 = parts[6]?.replace(/^"|"$/g, '').trim();
    if (!id || !p1 || !p2) continue;
    rows.push({ video_id: id, batch_date: date, monte, tema, p1_copy: p1, p2_copy: p2, formato, source: 'import' });
  }
  return rows;
}

async function seedCopies() {
  const rows = parseCopiesMd();
  console.log(`  Parsed ${rows.length} copies`);
  if (rows.length === 0) return;
  // Upsert em batches
  const batchSize = 200;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize);
    const { error } = await supa.from('copies').upsert(slice, { onConflict: 'video_id' });
    if (error) throw error;
    inserted += slice.length;
  }
  console.log(`✓ copies: ${inserted}`);
}

// ============ MAIN ============
async function main() {
  console.log('Seeding…');
  await seedFormatos();
  await seedMontes();
  await seedPsychology();
  await seedCopies();
  console.log('✓ Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
