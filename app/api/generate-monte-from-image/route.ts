import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateMonteFromImage } from '@/lib/openai';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Falta file' }, { status: 400 });
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Arquivo precisa ser imagem' }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Imagem maior que 10 MB' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${user.id}/${Date.now()}-monte-ref.${ext}`;
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

  let prompt: string;
  try {
    prompt = await generateMonteFromImage(publicUrl);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Falha análise', detail: msg }, { status: 500 });
  }

  await supabase.from('prompt_generations').insert({
    user_id: user.id,
    kind: 'monte',
    input_image_url: publicUrl,
    monte_params: { mode: 'from-image', image_url: publicUrl },
    monte_prompt: prompt,
  });

  return NextResponse.json({ prompt, imageUrl: publicUrl });
}
