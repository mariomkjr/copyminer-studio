import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { buildP1Prompt, buildExtendPrompt, type ImageAnalysis } from '@/lib/templates';

export const runtime = 'nodejs';
export const maxDuration = 30;

const Schema = z.object({
  imageUrl: z.string().url().optional(),
  analysis: z.record(z.string(), z.any()).nullable().optional(),
  p1_copy: z.string().min(5),
  p2_copy: z.string().min(5),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let parsed;
  try { parsed = Schema.parse(await req.json()); }
  catch (e) { return NextResponse.json({ error: 'Invalid input', detail: String(e) }, { status: 400 }); }

  const analysis = (parsed.analysis ?? null) as ImageAnalysis | null;
  const p1Prompt = buildP1Prompt(analysis, parsed.p1_copy);
  const extPrompt = buildExtendPrompt(analysis, parsed.p2_copy);

  // Log
  await supabase.from('prompt_generations').insert({
    user_id: user.id,
    kind: 'video',
    input_image_url: parsed.imageUrl,
    image_analysis: analysis,
    p1_copy: parsed.p1_copy,
    p2_copy: parsed.p2_copy,
    p1_prompt: p1Prompt,
    ext_prompt: extPrompt,
  });

  return NextResponse.json({ p1_prompt: p1Prompt, ext_prompt: extPrompt });
}
