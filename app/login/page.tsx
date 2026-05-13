'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus('error');
      setErrorMsg(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-zinc-900 mb-1">copyminer-studio</h1>
      <p className="text-sm text-zinc-700 mb-7">Entra com seu e-mail e senha.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-zinc-900">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </label>
        <label className="text-sm font-medium text-zinc-900">
          Senha
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
        <button
          type="submit"
          disabled={status === 'sending'}
          className="rounded-md bg-amber-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60 transition"
        >
          {status === 'sending' ? 'Entrando…' : 'Entrar'}
        </button>
        {status === 'error' && <p className="text-sm text-red-700">{errorMsg}</p>}
      </form>

      <div className="mt-6 pt-5 border-t border-zinc-200 text-sm text-zinc-700">
        Primeiro acesso?{' '}
        <Link href="/signup" className="text-amber-700 font-semibold hover:underline">
          Criar conta
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-full flex-1 flex items-center justify-center bg-zinc-50 px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
