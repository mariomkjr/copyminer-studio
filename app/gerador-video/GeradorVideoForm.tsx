'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { ImageAnalysis } from '@/lib/templates';

type Stage = 'idle' | 'working' | 'done';
type Copy = { tema: string; formato: string; p1_copy: string; p2_copy: string };

const FORMATOS = [
  { slug: 'bencao_pessoal', label: 'Bênção pessoal (default 70%)' },
  { slug: 'curiosidade_revelada', label: 'Curiosidade revelada (8%)' },
  { slug: 'pergunta_paternal', label: 'Pergunta paternal (8%)' },
  { slug: 'lista_profetica', label: 'Lista profética (7%)' },
  { slug: 'negacao_amorosa', label: 'Negação amorosa (5%)' },
  { slug: 'identificacao_inversa', label: 'Identificação inversa (2%)' },
];

export default function GeradorVideoForm() {
  const [stage, setStage] = useState<Stage>('idle');
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [formato, setFormato] = useState('bencao_pessoal');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const [copy, setCopy] = useState<Copy | null>(null);
  const [p1Prompt, setP1Prompt] = useState('');
  const [extPrompt, setExtPrompt] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  async function uploadAndGenerate(file: File, fmt: string) {
    setError('');
    setStage('working');
    setStatus('Subindo imagem…');
    setPreviewUrl(URL.createObjectURL(file));
    setAnalysis(null);
    setCopy(null);
    const form = new FormData();
    form.append('file', file);
    form.append('formato', fmt);
    setStatus('Analisando com GPT-4o e gerando copies…');
    const res = await fetch('/api/analyze-image', { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) {
      setError(`${data?.error || 'Falha'}${data?.detail ? `: ${data.detail}` : ''}`);
      setStage('idle');
      return;
    }
    setImageUrl(data.imageUrl);
    setAnalysis(data.analysis);
    setCopy(data.copy);
    setP1Prompt(data.p1_prompt);
    setExtPrompt(data.ext_prompt);
    setStage('done');
    setStatus('');
  }

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (file) uploadAndGenerate(file, formato);
  }, [formato]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: stage === 'working',
  });

  async function regenerateCopy() {
    if (!analysis) return;
    setStage('working');
    setStatus('Gerando nova copy…');
    setError('');
    const res = await fetch('/api/generate-prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, analysis, formato, mode: 'regenerate-copy' }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || 'Falha geração');
      setStage('done');
      return;
    }
    setCopy(data.copy);
    setP1Prompt(data.p1_prompt);
    setExtPrompt(data.ext_prompt);
    setStage('done');
    setStatus('');
  }

  async function rebuildPrompts() {
    if (!analysis || !copy) return;
    setStage('working');
    setStatus('Recompondo prompts com a copy editada…');
    setError('');
    const res = await fetch('/api/generate-prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl, analysis, formato,
        mode: 'rebuild-prompts',
        p1_copy: copy.p1_copy, p2_copy: copy.p2_copy,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || 'Falha');
      setStage('done');
      return;
    }
    setP1Prompt(data.p1_prompt);
    setExtPrompt(data.ext_prompt);
    setStage('done');
    setStatus('');
  }

  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function updateAnalysis(field: keyof ImageAnalysis, value: string) {
    setAnalysis((prev) => ({ ...(prev || {}), [field]: value }));
  }

  function updateCopy(field: 'p1_copy' | 'p2_copy' | 'tema', value: string) {
    setCopy((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  return (
    <div className="space-y-6">
      {/* Formato + upload */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-5">
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-zinc-900 mb-1.5 block">Formato</label>
            <select
              value={formato}
              onChange={(e) => setFormato(e.target.value)}
              disabled={stage === 'working'}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            >
              {FORMATOS.map(f => <option key={f.slug} value={f.slug}>{f.label}</option>)}
            </select>
          </div>
          {stage === 'done' && (
            <button
              onClick={regenerateCopy}
              className="rounded-md bg-amber-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
            >
              ↻ Gerar nova copy
            </button>
          )}
        </div>

        <div
          {...getRootProps()}
          className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition ${
            isDragActive
              ? 'border-amber-500 bg-amber-50'
              : stage === 'working'
                ? 'border-zinc-200 bg-zinc-50 cursor-wait'
                : 'border-zinc-300 bg-zinc-50 hover:border-amber-400 hover:bg-amber-50/30'
          }`}
        >
          <input {...getInputProps()} />
          {!previewUrl && stage === 'idle' && (
            <div>
              <p className="text-base text-zinc-900 font-medium mb-1">Arrasta a imagem do "Pai" aqui</p>
              <p className="text-sm text-zinc-600">ou clica pra escolher (jpg/png/webp, máx 10 MB)</p>
              <p className="text-xs text-zinc-500 mt-3">A análise + geração de copy levam ~10-15s</p>
            </div>
          )}
          {previewUrl && stage === 'working' && (
            <div className="flex flex-col items-center gap-3">
              <img src={previewUrl} alt="ref" className="max-h-48 rounded shadow-md" />
              <p className="text-base text-zinc-900 font-medium animate-pulse">{status || 'Processando…'}</p>
            </div>
          )}
          {previewUrl && stage === 'done' && (
            <div className="flex flex-col items-center gap-3">
              <img src={previewUrl} alt="ref" className="max-h-48 rounded shadow-md" />
              <p className="text-sm text-zinc-600">Trocar imagem? Solte outra aqui.</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {analysis && stage === 'done' && (
        <details className="rounded-xl border border-zinc-200 bg-white p-6">
          <summary className="text-sm font-semibold cursor-pointer text-zinc-900 select-none">
            Análise da imagem (clique pra editar)
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {(['roupa', 'expressao', 'angulo', 'iluminacao', 'cenario', 'emocao', 'idade_aparente', 'etnia'] as const).map((field) => (
              <label key={field} className="flex flex-col">
                <span className="text-xs font-medium text-zinc-700 mb-1 capitalize">{field.replace('_', ' ')}</span>
                <input
                  value={(analysis[field] as string) || ''}
                  onChange={(e) => updateAnalysis(field, e.target.value)}
                  className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900"
                />
              </label>
            ))}
          </div>
        </details>
      )}

      {copy && stage === 'done' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-zinc-900">Copies geradas <span className="text-zinc-500 font-normal">— {copy.formato}</span></h3>
              {copy.tema && <p className="text-sm text-zinc-700 mt-0.5">Tema: <span className="font-medium">{copy.tema}</span></p>}
            </div>
            <button
              onClick={rebuildPrompts}
              className="text-sm rounded-md border border-amber-300 bg-white px-3 py-1.5 hover:bg-amber-100"
            >
              Recompor prompts com edição
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-zinc-900 mb-1.5 block">P1 (parte 1)</label>
              <textarea
                value={copy.p1_copy}
                onChange={(e) => updateCopy('p1_copy', e.target.value)}
                rows={3}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              />
              <p className="text-xs text-zinc-600 mt-1">{copy.p1_copy.split(/\s+/).filter(Boolean).length} palavras</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-zinc-900 mb-1.5 block">P2 (extend)</label>
              <textarea
                value={copy.p2_copy}
                onChange={(e) => updateCopy('p2_copy', e.target.value)}
                rows={3}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              />
              <p className="text-xs mt-1 flex justify-between">
                <span className="text-zinc-600">{copy.p2_copy.split(/\s+/).filter(Boolean).length} palavras</span>
                <span className={/am[eé]m/i.test(copy.p2_copy) ? 'text-emerald-700' : 'text-amber-700'}>
                  {/am[eé]m/i.test(copy.p2_copy) ? '✓ tem CTA' : '⚠ falta CTA "amém"'}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {stage === 'done' && p1Prompt && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Prompt P1 — image-to-video', text: p1Prompt, key: 'p1', hint: 'Cola no Flow com a imagem como Frame Inicial' },
            { label: 'Prompt Extend', text: extPrompt, key: 'ext', hint: 'Após P1 gerar, abre o vídeo → Estender → cola' },
          ].map((b) => (
            <div key={b.key} className="rounded-xl border-2 border-amber-400 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-zinc-900">{b.label}</h3>
                <button
                  onClick={() => handleCopy(b.text, b.key)}
                  className={`text-sm rounded-md px-3 py-1.5 font-medium transition ${
                    copied === b.key ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white hover:bg-amber-700'
                  }`}
                >
                  {copied === b.key ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs text-zinc-600 mb-2">{b.hint}</p>
              <textarea
                readOnly
                value={b.text}
                className="w-full min-h-[200px] rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm font-mono text-zinc-900 leading-relaxed"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
