'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { ImageAnalysis } from '@/lib/templates';

type Stage = 'idle' | 'analyzing' | 'analyzed' | 'generating' | 'done';

export default function GeradorVideoForm() {
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const [p1Copy, setP1Copy] = useState('');
  const [p2Copy, setP2Copy] = useState('');
  const [p1Prompt, setP1Prompt] = useState('');
  const [extPrompt, setExtPrompt] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setError('');
    setStage('analyzing');
    setAnalysis(null);
    setImageUrl(URL.createObjectURL(file));
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/analyze-image', { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || 'Falha análise');
      setStage('idle');
      return;
    }
    setImageUrl(data.imageUrl);
    setAnalysis(data.analysis);
    setStage('analyzed');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  async function handleGenerate() {
    if (!p1Copy.trim() || !p2Copy.trim()) {
      setError('Preencha P1 e P2');
      return;
    }
    setError('');
    setStage('generating');
    const res = await fetch('/api/generate-prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, analysis, p1_copy: p1Copy, p2_copy: p2Copy }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || 'Falha geração');
      setStage('analyzed');
      return;
    }
    setP1Prompt(data.p1_prompt);
    setExtPrompt(data.ext_prompt);
    setStage('done');
  }

  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function updateAnalysis(field: keyof ImageAnalysis, value: string) {
    setAnalysis((prev) => ({ ...(prev || {}), [field]: value }));
  }

  const p2HasCta = /am[eé]m/i.test(p2Copy);

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition ${
          isDragActive
            ? 'border-amber-500 bg-amber-50'
            : 'border-zinc-300 bg-white hover:border-amber-400'
        }`}
      >
        <input {...getInputProps()} />
        {!imageUrl && (
          <div>
            <p className="text-sm text-zinc-700">
              Arrasta uma imagem do "Pai" aqui ou clica pra escolher (jpg/png/webp, máx 10 MB)
            </p>
            <p className="text-xs text-zinc-500 mt-1">A análise é feita por GPT-4o vision (~5s)</p>
          </div>
        )}
        {imageUrl && stage === 'analyzing' && (
          <div className="flex flex-col items-center gap-3">
            <img src={imageUrl} alt="ref" className="max-h-48 rounded shadow" />
            <p className="text-sm text-zinc-700">Analisando imagem com GPT-4o…</p>
          </div>
        )}
        {imageUrl && stage !== 'analyzing' && analysis && (
          <div className="flex flex-col items-center gap-3">
            <img src={imageUrl} alt="ref" className="max-h-48 rounded shadow" />
            <p className="text-xs text-zinc-500">Trocar imagem? Solte outra aqui.</p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Análise editável */}
      {analysis && (
        <details open className="rounded-lg border border-zinc-200 bg-white p-5">
          <summary className="text-sm font-semibold cursor-pointer text-zinc-900">
            Análise da imagem (edite se quiser ajustar antes de gerar)
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {(['roupa', 'expressao', 'angulo', 'iluminacao', 'cenario', 'emocao', 'idade_aparente', 'etnia'] as const).map((field) => (
              <label key={field} className="flex flex-col">
                <span className="text-xs font-medium text-zinc-700 mb-1 capitalize">{field.replace('_', ' ')}</span>
                <input
                  value={(analysis[field] as string) || ''}
                  onChange={(e) => updateAnalysis(field, e.target.value)}
                  className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs"
                />
              </label>
            ))}
          </div>
        </details>
      )}

      {/* Copies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <label className="text-sm font-semibold text-zinc-900 mb-1.5 block">Copy P1 (parte 1, 8s)</label>
          <p className="text-xs text-zinc-500 mb-2">Validação invisível / dor / abertura. ~16 palavras.</p>
          <textarea
            value={p1Copy}
            onChange={(e) => setP1Copy(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm"
            placeholder="Eu vi a oração que tu fez ontem à noite escondido no quarto…"
          />
          <p className="text-xs text-zinc-500 mt-1">{p1Copy.split(/\s+/).filter(Boolean).length} palavras</p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <label className="text-sm font-semibold text-zinc-900 mb-1.5 block">Copy P2 (extend, 8s)</label>
          <p className="text-xs text-zinc-500 mb-2">Continuação semântica do P1 (não repete). Termina com CTA "Comenta amém"/"Digita Amém".</p>
          <textarea
            value={p2Copy}
            onChange={(e) => setP2Copy(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm"
            placeholder="Tua resposta chega ainda essa semana. Recebe pela fé. Comenta amém."
          />
          <p className="text-xs mt-1 flex justify-between">
            <span className="text-zinc-500">{p2Copy.split(/\s+/).filter(Boolean).length} palavras</span>
            {p2Copy && (
              <span className={p2HasCta ? 'text-emerald-700' : 'text-amber-700'}>
                {p2HasCta ? '✓ tem CTA' : '⚠ falta CTA "amém"'}
              </span>
            )}
          </p>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!p1Copy.trim() || !p2Copy.trim() || stage === 'generating'}
        className="w-full rounded-md bg-amber-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
      >
        {stage === 'generating' ? 'Gerando prompts…' : 'Gerar prompts P1 + Extend'}
      </button>

      {/* Output */}
      {stage === 'done' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Prompt P1 (image-to-video)', text: p1Prompt, key: 'p1' },
            { label: 'Prompt Extend (a partir do último frame)', text: extPrompt, key: 'ext' },
          ].map((b) => (
            <div key={b.key} className="rounded-lg border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-zinc-900">{b.label}</h3>
                <button
                  onClick={() => handleCopy(b.text, b.key)}
                  className="text-xs rounded-md border border-zinc-300 px-2 py-1 hover:bg-zinc-100"
                >
                  {copied === b.key ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
              <textarea
                readOnly
                value={b.text}
                className="w-full min-h-[200px] rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs font-mono"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
