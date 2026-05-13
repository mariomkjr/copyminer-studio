'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'done'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }
    if (data.session) {
      router.push('/');
      router.refresh();
    } else {
      setStatus('done');
    }
  }

  return (
    <main className="min-h-full flex-1 flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-1">Criar conta</h1>
        <p className="text-sm text-zinc-700 mb-7">Define seu acesso ao copyminer-studio.</p>

        {status !== 'done' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="text-sm font-medium text-zinc-900">
              Nome
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </label>
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
              Senha (mínimo 6 caracteres)
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
              {status === 'sending' ? 'Criando…' : 'Criar conta'}
            </button>
            {status === 'error' && <p className="text-sm text-red-700">{errorMsg}</p>}
          </form>
        )}

        {status === 'done' && (
          <div className="rounded-md bg-emerald-50 border border-emerald-200 p-4">
            <p className="text-sm text-emerald-900">
              Conta criada. Confere seu e-mail <strong>{email}</strong> pra confirmar e fazer login.
            </p>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-zinc-200 text-sm text-zinc-700">
          Já tem conta?{' '}
          <Link href="/login" className="text-amber-700 font-semibold hover:underline">
            Entrar
          </Link>
        </div>
      </div>
    </main>
  );
}
