import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/SignOutButton';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: tm } = user
    ? await supabase.from('team_members').select('role').eq('user_id', user.id).maybeSingle()
    : { data: null };
  const isAdmin = tm?.role === 'admin';

  const cards = [
    {
      href: '/gerador-video',
      title: 'Gerador prompt P1 + Extend',
      desc: 'Upload imagem de referência → análise GPT-4o → prompts P1 e Extend prontos pra Flow.',
      emoji: '🎬',
    },
    {
      href: '/gerador-imagem',
      title: 'Gerador prompt Nanobana',
      desc: 'Cria prompt pra gerar uma nova imagem MONTE (foto do Pai) no Nano Banana Pro.',
      emoji: '🎨',
    },
    {
      href: '/biblioteca',
      title: 'Biblioteca formatos + psicologia',
      desc: 'Os 6 formatos validados, gatilhos psicológicos, regras e palavras-gatilho a evitar.',
      emoji: '📚',
    },
    {
      href: '/historico',
      title: 'Histórico de copies',
      desc: 'Tabela com todas as copies já feitas (851+ entradas). Filtros por formato/tema/MONTE/autor.',
      emoji: '📜',
    },
  ];

  return (
    <div className="min-h-full flex-1 bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-base font-semibold text-zinc-900">copyminer-studio</h1>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link href="/admin" className="text-sm font-semibold text-amber-700 hover:underline">
                Admin
              </Link>
            )}
            <span className="text-sm text-zinc-600">{user?.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-zinc-900 mb-2">Bem-vindo</h2>
          <p className="text-base text-zinc-700">Geradores de prompt do nicho copyminer-fé. Escolhe um módulo:</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group block rounded-xl border border-zinc-200 bg-white p-7 transition hover:border-amber-400 hover:shadow-md"
            >
              <div className="text-4xl mb-4">{c.emoji}</div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-1.5 group-hover:text-amber-700">
                {c.title}
              </h3>
              <p className="text-sm text-zinc-700 leading-relaxed">{c.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
