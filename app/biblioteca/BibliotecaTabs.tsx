'use client';

import { useState } from 'react';

type Formato = {
  slug: string;
  name: string;
  description: string | null;
  gatilho: string | null;
  when_to_use: string | null;
  when_not_to_use: string | null;
  target_percent: number | null;
};

type Hook = {
  id: string;
  categoria: string;
  gatilho: string | null;
  rationale: string | null;
};

const REGRAS = [
  {
    titulo: 'Palavras-gatilho do Veo (evitar)',
    body: '"adolescente" + sofrimento = filtro silencioso. Use "jovem", "teu jovem em casa". Outros gatilhos observados: "criança" + dor extrema, "morte", "suicídio". Sempre testar com palavra mais neutra primeiro.',
  },
  {
    titulo: 'Densidade da copy (8s)',
    body: '16-17 palavras por parte. Não há pausa entre P1 e P2. Prompt deve incluir "speaks continuously, no silent gaps". Velocidade: lenta cadência brasileira paternal.',
  },
  {
    titulo: 'CTA obrigatório no P2',
    body: 'Toda copy P2 termina com "Comenta amém" ou "Digita Amém". Sem exceção. Outras variações aceitas: "Recebe pela fé. Comenta amém."',
  },
  {
    titulo: 'P2 não repete P1',
    body: 'A copy P2 é continuação semântica do P1, não repetição. Se P1 fala da dor, P2 entrega a profecia. Se P1 pergunta, P2 responde.',
  },
  {
    titulo: 'Tom paternal — voz do Pai',
    body: 'Voz: deep paternal compassionate male voice, slow Brazilian cadence, São Paulo/Rio accent. NUNCA Portugal/Lisboa. Sempre 1ª pessoa do Pai falando com o filho/a.',
  },
  {
    titulo: 'MONTES — rotação livre, copy nunca repete',
    body: 'MONTES podem repetir entre vídeos diferentes (rotação round-robin). Copies NUNCA repetem — checar /historico antes de gerar nova.',
  },
];

export default function BibliotecaTabs({ formatos, psychology }: { formatos: Formato[]; psychology: Hook[] }) {
  const [tab, setTab] = useState<'formatos' | 'psicologia' | 'regras'>('formatos');

  const tabBtn = (id: typeof tab, label: string) => (
    <button
      onClick={() => setTab(id)}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
        tab === id
          ? 'border-amber-600 text-amber-700'
          : 'border-transparent text-zinc-600 hover:text-zinc-900'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex border-b border-zinc-200 mb-6">
        {tabBtn('formatos', 'Formatos')}
        {tabBtn('psicologia', 'Psicologia')}
        {tabBtn('regras', 'Regras')}
      </div>

      {tab === 'formatos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formatos.map((f) => (
            <div key={f.slug} className="rounded-lg border border-zinc-200 bg-white p-5">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-base font-semibold text-zinc-900">{f.name}</h3>
                {f.target_percent != null && (
                  <span className="text-xs text-zinc-500 font-mono">{f.target_percent}%</span>
                )}
              </div>
              <p className="text-sm text-zinc-600 mb-3">{f.description}</p>
              {f.gatilho && (
                <div className="text-xs mb-2"><span className="font-medium text-zinc-700">Gatilho: </span><span className="text-zinc-600">{f.gatilho}</span></div>
              )}
              {f.when_to_use && (
                <div className="text-xs mb-2"><span className="font-medium text-emerald-700">Usar: </span><span className="text-zinc-600">{f.when_to_use}</span></div>
              )}
              {f.when_not_to_use && (
                <div className="text-xs"><span className="font-medium text-red-700">Evitar: </span><span className="text-zinc-600">{f.when_not_to_use}</span></div>
              )}
            </div>
          ))}
          {formatos.length === 0 && <p className="text-sm text-zinc-500">Nenhum formato no banco ainda. Rode o seed.</p>}
        </div>
      )}

      {tab === 'psicologia' && (
        <div className="grid grid-cols-1 gap-3">
          {psychology.map((h) => (
            <div key={h.id} className="rounded-lg border border-zinc-200 bg-white p-5">
              <h3 className="text-base font-semibold text-zinc-900 mb-2">{h.categoria}</h3>
              {h.rationale && (
                <pre className="text-xs text-zinc-600 whitespace-pre-wrap font-sans">{h.rationale}</pre>
              )}
            </div>
          ))}
          {psychology.length === 0 && <p className="text-sm text-zinc-500">Nenhum gatilho no banco ainda. Rode o seed.</p>}
        </div>
      )}

      {tab === 'regras' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REGRAS.map((r) => (
            <div key={r.titulo} className="rounded-lg border border-zinc-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-zinc-900 mb-2">{r.titulo}</h3>
              <p className="text-sm text-zinc-600">{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
