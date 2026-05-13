import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import PageHeader from '@/components/PageHeader';
import InviteForm from './InviteForm';

export const dynamic = 'force-dynamic';

type UserRow = {
  user_id: string;
  email: string | null;
  name: string | null;
  role: string;
  created_at: string;
  last_sign_in: string | null;
  total: number;
  videos: number;
  montes: number;
  last_gen: string | null;
};

type GenRow = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  kind: string;
  p1_copy: string | null;
  p2_copy: string | null;
  monte_prompt: string | null;
  created_at: string;
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: tm } = await supabase.from('team_members').select('role').eq('user_id', user.id).maybeSingle();
  if (tm?.role !== 'admin') redirect('/');

  const admin = createAdminClient();

  // Lista de users
  const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const { data: members } = await admin.from('team_members').select('user_id, name, role, created_at');
  const membersMap = new Map((members || []).map((m: { user_id: string }) => [m.user_id, m]));

  // Gerações
  const { data: gens } = await admin
    .from('prompt_generations')
    .select('id, user_id, kind, p1_copy, p2_copy, monte_prompt, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  const genByUser = new Map<string, { total: number; videos: number; montes: number; last: string | null }>();
  for (const g of gens || []) {
    const cur = genByUser.get(g.user_id) || { total: 0, videos: 0, montes: 0, last: null };
    cur.total += 1;
    if (g.kind === 'video') cur.videos += 1;
    if (g.kind === 'monte') cur.montes += 1;
    if (!cur.last || g.created_at > cur.last) cur.last = g.created_at;
    genByUser.set(g.user_id, cur);
  }

  const users: UserRow[] = (authUsers.users || []).map((u): UserRow => {
    const m = membersMap.get(u.id) as { name?: string; role?: string; created_at?: string } | undefined;
    const stats = genByUser.get(u.id) || { total: 0, videos: 0, montes: 0, last: null };
    return {
      user_id: u.id,
      email: u.email ?? null,
      name: (m?.name as string) || null,
      role: (m?.role as string) || 'member',
      created_at: u.created_at,
      last_sign_in: u.last_sign_in_at ?? null,
      total: stats.total,
      videos: stats.videos,
      montes: stats.montes,
      last_gen: stats.last,
    };
  }).sort((a, b) => b.total - a.total);

  const usersMap = new Map(users.map(u => [u.user_id, u]));
  const recent: GenRow[] = (gens || []).slice(0, 100).map((g): GenRow => {
    const u = usersMap.get(g.user_id);
    return {
      id: g.id,
      user_id: g.user_id,
      user_email: u?.email || '—',
      user_name: u?.name || u?.email?.split('@')[0] || '—',
      kind: g.kind,
      p1_copy: g.p1_copy,
      p2_copy: g.p2_copy,
      monte_prompt: g.monte_prompt,
      created_at: g.created_at,
    };
  });

  const totalGens = gens?.length || 0;
  const totalVideos = (gens || []).filter(g => g.kind === 'video').length;
  const totalMontes = (gens || []).filter(g => g.kind === 'monte').length;
  const last7d = (gens || []).filter(g => new Date(g.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;

  return (
    <div className="min-h-full flex-1 bg-zinc-50">
      <PageHeader title="Admin" userEmail={user.email} />
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900 mb-1">Painel admin</h2>
          <p className="text-sm text-zinc-700">Acompanha o time, convida membros e vê todas as gerações.</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Usuários" value={users.length} />
          <StatCard label="Gerações totais" value={totalGens} />
          <StatCard label="Vídeos" value={totalVideos} />
          <StatCard label="Últimos 7 dias" value={last7d} />
        </div>

        {/* Convite */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h3 className="text-base font-semibold text-zinc-900 mb-3">Convidar novo membro</h3>
          <InviteForm />
        </section>

        {/* Usuários */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h3 className="text-base font-semibold text-zinc-900 mb-4">Usuários ({users.length})</h3>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-500 border-b border-zinc-200">
                  <th className="px-6 py-2.5 font-medium">Nome / e-mail</th>
                  <th className="px-3 py-2.5 font-medium">Papel</th>
                  <th className="px-3 py-2.5 font-medium text-right">Total</th>
                  <th className="px-3 py-2.5 font-medium text-right">Vídeos</th>
                  <th className="px-3 py-2.5 font-medium text-right">Montes</th>
                  <th className="px-3 py-2.5 font-medium">Última geração</th>
                  <th className="px-6 py-2.5 font-medium">Último login</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} className="border-b border-zinc-100 hover:bg-amber-50/40">
                    <td className="px-6 py-3">
                      <div className="font-medium text-zinc-900">{u.name || u.email?.split('@')[0]}</div>
                      <div className="text-xs text-zinc-500">{u.email}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-zinc-900">{u.total}</td>
                    <td className="px-3 py-3 text-right text-zinc-700">{u.videos}</td>
                    <td className="px-3 py-3 text-right text-zinc-700">{u.montes}</td>
                    <td className="px-3 py-3 text-zinc-700">{u.last_gen ? formatDate(u.last_gen) : '—'}</td>
                    <td className="px-6 py-3 text-zinc-700">{u.last_sign_in ? formatDate(u.last_sign_in) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Gerações recentes */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h3 className="text-base font-semibold text-zinc-900 mb-4">Gerações recentes (últimas {recent.length})</h3>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-500 border-b border-zinc-200">
                  <th className="px-6 py-2.5 font-medium">Quem</th>
                  <th className="px-3 py-2.5 font-medium">Tipo</th>
                  <th className="px-3 py-2.5 font-medium">Conteúdo</th>
                  <th className="px-6 py-2.5 font-medium">Quando</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((g) => (
                  <tr key={g.id} className="border-b border-zinc-100 align-top hover:bg-amber-50/40">
                    <td className="px-6 py-3">
                      <div className="font-medium text-zinc-900">{g.user_name}</div>
                      <div className="text-xs text-zinc-500">{g.user_email}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        g.kind === 'video' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {g.kind}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-zinc-700 max-w-xl">
                      {g.kind === 'video' ? (
                        <>
                          <div className="line-clamp-2"><span className="font-medium text-zinc-900">P1:</span> {g.p1_copy}</div>
                          <div className="line-clamp-2 mt-0.5"><span className="font-medium text-zinc-900">P2:</span> {g.p2_copy}</div>
                        </>
                      ) : (
                        <div className="line-clamp-2 font-mono text-xs">{g.monte_prompt}</div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-zinc-700 whitespace-nowrap">{formatDate(g.created_at)}</td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-zinc-500">Nenhuma geração ainda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="text-xs uppercase tracking-wide text-zinc-500 font-medium">{label}</div>
      <div className="text-3xl font-semibold text-zinc-900 mt-1">{value}</div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}
