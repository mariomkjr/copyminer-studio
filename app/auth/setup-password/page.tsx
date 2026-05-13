'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SetupPasswordPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setStatus('error');
      setErrorMsg('Senhas não conferem.');
      return;
    }
    setStatus('sending');
    setErrorMsg('');
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password,
      data: name ? { name } : undefined,
    });
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }
    // Atualiza nome no team_members também
    const { data: { user } } = await supabase.auth.getUser();
    if (user && name) {
      await supabase.from('team_members').update({ name }).eq('user_id', user.id);
    }
    router.push('/');
    router.refresh();
  }

  return (
    <main className="min-h-full flex-1 flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-1">Defina sua senha</h1>
        <p className="text-sm text-zinc-700 mb-7">Primeiro acesso. Escolhe um nome e uma senha pra usar daqui em diante.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-zinc-900">
            Nome
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </label>
          <label className="text-sm font-medium text-zinc-900">
            Nova senha (mínimo 6 caracteres)
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </label>
          <label className="text-sm font-medium text-zinc-900">
            Confirmar senha
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </label>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="rounded-md bg-amber-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60 transition"
          >
            {status === 'sending' ? 'Salvando…' : 'Salvar e entrar'}
          </button>
          {status === 'error' && <p className="text-sm text-red-700">{errorMsg}</p>}
        </form>
      </div>
    </main>
  );
}
