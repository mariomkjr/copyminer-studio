import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: tm } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  return tm?.role === 'admin' ? user : null;
}

export async function POST(req: NextRequest) {
  const admin = await assertAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const email = String(body?.email || '').trim().toLowerCase();
  const name = body?.name ? String(body.name) : undefined;
  if (!email) return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 });

  const supaAdmin = createAdminClient();
  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || '';
  const { data, error } = await supaAdmin.auth.admin.inviteUserByEmail(email, {
    data: name ? { name } : undefined,
    redirectTo: `${origin}/auth/callback?type=invite`,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, user_id: data.user?.id });
}
