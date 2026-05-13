import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { buildMontePrompt, type EmocaoKey, type IluminacaoKey, type CenarioKey, type AnguloKey } from '@/lib/templates';

export const runtime = 'nodejs';
export const maxDuration = 60;

const Schema = z.object({
  emocaoKey: z.string(),
  iluminacaoKey: z.string(),
  cenarioKey: z.string(),
  anguloKey: z.string(),
  extras: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let parsed;
  try {
    parsed = Schema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: 'Invalid input', detail: String(e) }, { status: 400 });
  }

  const prompt = buildMontePrompt({
    emocaoKey: parsed.emocaoKey as EmocaoKey,
    iluminacaoKey: parsed.iluminacaoKey as IluminacaoKey,
    cenarioKey: parsed.cenarioKey as CenarioKey,
    anguloKey: parsed.anguloKey as AnguloKey,
    extras: parsed.extras,
  });

  // Log da geração
  await supabase.from('prompt_generations').insert({
    user_id: user.id,
    kind: 'monte',
    monte_params: parsed,
    monte_prompt: prompt,
  });

  return NextResponse.json({ prompt });
}
