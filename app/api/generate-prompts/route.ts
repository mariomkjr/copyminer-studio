import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { generateCopy } from '@/lib/openai';
import { buildP1Prompt, buildExtendPrompt, type ImageAnalysis } from '@/lib/templates';

export const runtime = 'nodejs';
export const maxDuration = 60;

const Schema = z.object({
  imageUrl: z.string().url().optional(),
  analysis: z.record(z.string(), z.any()).nullable().optional(),
  formato: z.string(),
  mode: z.enum(['regenerate-copy', 'rebuild-prompts']),
  // Quando mode = 'rebuild-prompts': aceita copies editadas manualmente
  p1_copy: z.string().optional(),
  p2_copy: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let parsed;
  try { parsed = Schema.parse(await req.json()); }
  catch (e) { return NextResponse.json({ error: 'Invalid input', detail: String(e) }, { status: 400 }); }

  const analysis = (parsed.analysis ?? {}) as ImageAnalysis;

  let p1Copy = parsed.p1_copy || '';
  let p2Copy = parsed.p2_copy || '';
  let tema = '';

  if (parsed.mode === 'regenerate-copy') {
    // Gera nova copy do zero
    const { data: recent } = await supabase
      .from('copies')
      .select('tema, p1_copy, p2_copy')
      .order('created_at', { ascending: false })
      .limit(60);
    const avoid = (recent || []).map(r => `${r.tema}: ${r.p1_copy}`);
    const copy = await generateCopy(analysis, parsed.formato, avoid);
    p1Copy = copy.p1_copy;
    p2Copy = copy.p2_copy;
    tema = copy.tema;
  }

  const p1_prompt = buildP1Prompt(analysis, p1Copy);
  const ext_prompt = buildExtendPrompt(analysis, p2Copy);

  return NextResponse.json({
    copy: { tema, formato: parsed.formato, p1_copy: p1Copy, p2_copy: p2Copy },
    p1_prompt,
    ext_prompt,
  });
}
