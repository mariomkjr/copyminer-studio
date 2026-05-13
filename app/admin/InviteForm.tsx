'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setMsg('');
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus('error');
      setMsg(data?.error || 'Falha ao convidar');
      return;
    }
    setStatus('sent');
    setMsg(`Convite enviado pra ${email}.`);
    setEmail('');
    setName('');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
      <label className="text-sm font-medium text-zinc-900">
        Nome
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do membro"
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
          placeholder="email@dominio.com"
          className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
      </label>
      <button
        type="submit"
        disabled={status === 'sending'}
        className="rounded-md bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
      >
        {status === 'sending' ? 'Enviando…' : 'Enviar convite'}
      </button>
      {status === 'sent' && <p className="md:col-span-3 text-sm text-emerald-700">{msg}</p>}
      {status === 'error' && <p className="md:col-span-3 text-sm text-red-700">{msg}</p>}
    </form>
  );
}
