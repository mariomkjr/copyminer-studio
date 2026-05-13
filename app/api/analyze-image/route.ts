import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeImage, generateCopy } from '@/lib/openai';
import { buildP1Prompt, buildExtendPrompt } from '@/lib/templates';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  const formato = String(form.get('formato') || 'bencao_pessoal');
  if (!file) return NextResponse.json({ error: 'Falta file' }, { status: 400 });
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Arquivo precisa ser imagem' }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Imagem maior que 10 MB' }, { status: 400 });
  }

  // Upload pro Supabase Storage
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${user.id}/${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await supabase.storage
    .from('reference-images')
    .upload(filename, bytes, { contentType: file.type, upsert: false });
  if (upErr) {
    return NextResponse.json({ error: 'Falha upload', detail: upErr.message }, { status: 500 });
  }
  const { data: { publicUrl } } = supabase.storage
    .from('reference-images')
    .getPublicUrl(filename);

  // Análise visual + 60 copies recentes pra evitar repetição
  const { data: recent } = await supabase
    .from('copies')
    .select('tema, p1_copy, p2_copy')
    .order('created_at', { ascending: false })
    .limit(60);
  const avoid = (recent || []).map(r => `${r.tema}: ${r.p1_copy}`);

  let analysis;
  try { analysis = await analyzeImage(publicUrl); }
  catch (e: any) {
    return NextResponse.json({ error: 'Falha análise', detail: e.message }, { status: 500 });
  }

  // Gera copy fresca usando o formato pedido + análise
  let copy;
  try { copy = await generateCopy(analysis, formato, avoid); }
  catch (e: any) {
    return NextResponse.json({ error: 'Falha geração de copy', detail: e.message }, { status: 500 });
  }

  // Monta prompts finais
  const p1_prompt = buildP1Prompt(analysis, copy.p1_copy);
  const ext_prompt = buildExtendPrompt(analysis, copy.p2_copy);

  // Log da geração
  await supabase.from('prompt_generations').insert({
    user_id: user.id,
    kind: 'video',
    input_image_url: publicUrl,
    image_analysis: analysis,
    p1_copy: copy.p1_copy,
    p2_copy: copy.p2_copy,
    p1_prompt,
    ext_prompt,
  });

  return NextResponse.json({
    imageUrl: publicUrl,
    analysis,
    copy,
    p1_prompt,
    ext_prompt,
  });
}
