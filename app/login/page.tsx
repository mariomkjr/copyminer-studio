'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('sent');
    }
  }

  return (
    <main className="min-h-full flex-1 flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-1">copyminer-studio</h1>
        <p className="text-sm text-zinc-700 mb-7">Acesso restrito ao time. Recebe um link de login no e-mail.</p>

        {status !== 'sent' && (
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
            <button
              type="submit"
              disabled={status === 'sending'}
              className="rounded-md bg-amber-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60 transition"
            >
              {status === 'sending' ? 'Enviando…' : 'Receber link'}
            </button>
            {status === 'error' && <p className="text-sm text-red-700">{errorMsg}</p>}
          </form>
        )}

        {status === 'sent' && (
          <div className="rounded-md bg-emerald-50 border border-emerald-200 p-4">
            <p className="text-sm text-emerald-900">
              Link enviado pra <strong>{email}</strong>. Confere a caixa de entrada e clica pra entrar.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
