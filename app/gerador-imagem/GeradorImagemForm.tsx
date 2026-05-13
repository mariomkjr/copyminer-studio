'use client';

import { useState } from 'react';

type Opt = { key: string; label: string };

export default function GeradorImagemForm({
  emocoes, iluminacoes, cenarios, angulos,
}: { emocoes: Opt[]; iluminacoes: Opt[]; cenarios: Opt[]; angulos: Opt[] }) {
  const [emocao, setEmocao] = useState(emocoes[0]?.key || '');
  const [iluminacao, setIluminacao] = useState(iluminacoes[0]?.key || '');
  const [cenario, setCenario] = useState(cenarios[0]?.key || '');
  const [angulo, setAngulo] = useState(angulos[0]?.key || '');
  const [extras, setExtras] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setPrompt('');
    setCopied(false);
    const res = await fetch('/api/generate-monte-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emocaoKey: emocao, iluminacaoKey: iluminacao, cenarioKey: cenario, anguloKey: angulo, extras }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      alert('Erro: ' + (data?.error || 'desconhecido'));
      return;
    }
    setPrompt(data.prompt);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const select = (val: string, setVal: (v: string) => void, opts: Opt[]) => (
    <select
      value={val}
      onChange={(e) => setVal(e.target.value)}
      className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm w-full"
    >
      {opts.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
    </select>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <form onSubmit={handleGenerate} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
        <div>
          <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Emoção</label>
          {select(emocao, setEmocao, emocoes)}
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Iluminação</label>
          {select(iluminacao, setIluminacao, iluminacoes)}
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Cenário</label>
          {select(cenario, setCenario, cenarios)}
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Ângulo</label>
          {select(angulo, setAngulo, angulos)}
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Extras (opcional)</label>
          <input
            value={extras}
            onChange={(e) => setExtras(e.target.value)}
            placeholder="ex: hands resting on table, blowing a strand of hair"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm w-full"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {loading ? 'Gerando…' : 'Gerar prompt'}
        </button>
      </form>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900">Prompt gerado</h3>
          {prompt && (
            <button
              onClick={handleCopy}
              className="text-xs rounded-md border border-zinc-300 px-2 py-1 hover:bg-zinc-100"
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          )}
        </div>
        {prompt ? (
          <textarea
            readOnly
            value={prompt}
            className="flex-1 min-h-[300px] rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs font-mono text-zinc-800"
          />
        ) : (
          <p className="text-sm text-zinc-500 italic">Preencha e clique em "Gerar prompt".</p>
        )}
        {prompt && (
          <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-900">
              <strong>Como usar:</strong> Cole o prompt no Flow → tab "Imagem" → Nano Banana Pro → x4 variações → escolha 1 → renomeie como <code>MONTE_XX.png</code> e adicione ao banco do Flow.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
