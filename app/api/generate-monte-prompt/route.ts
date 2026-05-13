import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { buildMontePrompt, type EmocaoKey, type IluminacaoKey, type CenarioKey, type AnguloKey } from '@/lib/templates';
import { generateMonteFreeform } from '@/lib/openai';

export const runtime = 'nodejs';
export const maxDuration = 60;

const GuidedSchema = z.object({
  mode: z.literal('guided'),
  emocaoKey: z.string(),
  iluminacaoKey: z.string(),
  cenarioKey: z.string(),
  anguloKey: z.string(),
  extras: z.string().optional(),
});

const FreeformSchema = z.object({
  mode: z.literal('freeform'),
  idea: z.string().min(5, 'Descreva sua ideia com mais detalhes'),
});

const Schema = z.union([GuidedSchema, FreeformSchema]);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let parsed;
  try {
    const body = await req.json();
    // Backwards-compat: se não vier `mode`, trata como guided
    parsed = Schema.parse({ mode: 'guided', ...body, ...(body.mode ? { mode: body.mode } : {}) });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid input', detail: String(e) }, { status: 400 });
  }

  let prompt: string;
  if (parsed.mode === 'freeform') {
    try {
      prompt = await generateMonteFreeform(parsed.idea);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: 'Falha geração freeform', detail: msg }, { status: 500 });
    }
  } else {
    prompt = buildMontePrompt({
      emocaoKey: parsed.emocaoKey as EmocaoKey,
      iluminacaoKey: parsed.iluminacaoKey as IluminacaoKey,
      cenarioKey: parsed.cenarioKey as CenarioKey,
      anguloKey: parsed.anguloKey as AnguloKey,
      extras: parsed.extras,
    });
  }

  await supabase.from('prompt_generations').insert({
    user_id: user.id,
    kind: 'monte',
    monte_params: parsed,
    monte_prompt: prompt,
  });

  return NextResponse.json({ prompt });
}
