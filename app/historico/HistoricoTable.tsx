'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Copy = {
  id: string;
  video_id: string | null;
  batch_date: string | null;
  monte: string | null;
  formato: string | null;
  tema: string | null;
  p1_copy: string;
  p2_copy: string;
  source: string;
  created_at: string;
};

const PAGE_SIZE = 30;

export default function HistoricoTable({
  formatos,
  montes,
}: {
  formatos: { slug: string; name: string }[];
  montes: { name: string }[];
}) {
  const [rows, setRows] = useState<Copy[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [search, setSearch] = useState('');
  const [formatoFilter, setFormatoFilter] = useState('');
  const [monteFilter, setMonteFilter] = useState('');

  useEffect(() => {
    const supabase = createClient();
    const debounce = setTimeout(async () => {
      setLoading(true);
      let q = supabase.from('copies').select('*', { count: 'exact' });
      if (formatoFilter) q = q.eq('formato', formatoFilter);
      if (monteFilter) q = q.eq('monte', monteFilter);
      if (search) {
        const s = search.replace(/[%_]/g, '');
        q = q.or(`tema.ilike.%${s}%,p1_copy.ilike.%${s}%,p2_copy.ilike.%${s}%,video_id.ilike.%${s}%`);
      }
      q = q.order('created_at', { ascending: false })
           .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      const { data, count } = await q;
      setRows(data || []);
      setTotal(count || 0);
      setLoading(false);
    }, 300);
    return () => clearTimeout(debounce);
  }, [search, formatoFilter, monteFilter, page]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <input
          placeholder="Buscar (tema, copy, V8-XX)…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 md:col-span-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
        />
        <select
          value={formatoFilter}
          onChange={(e) => { setFormatoFilter(e.target.value); setPage(0); }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Todos formatos</option>
          {formatos.map((f) => <option key={f.slug} value={f.slug}>{f.name}</option>)}
        </select>
        <select
          value={monteFilter}
          onChange={(e) => { setMonteFilter(e.target.value); setPage(0); }}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Todos MONTES</option>
          {montes.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
        </select>
      </div>

      <div className="text-sm text-zinc-700 mb-3 font-medium">
        {loading ? 'Carregando…' : `${total.toLocaleString('pt-BR')} copies — página ${page + 1} de ${Math.max(1, Math.ceil(total / PAGE_SIZE))}`}
      </div>

      <div className="rounded-lg border border-zinc-200 overflow-x-auto bg-white">
        <table className="w-full">
          <thead className="bg-zinc-100 text-zinc-800 text-sm">
            <tr>
              <th className="text-left px-3 py-2.5 font-semibold">ID</th>
              <th className="text-left px-3 py-2.5 font-semibold">Data</th>
              <th className="text-left px-3 py-2.5 font-semibold">MONTE</th>
              <th className="text-left px-3 py-2.5 font-semibold">Formato</th>
              <th className="text-left px-3 py-2.5 font-semibold">Tema</th>
              <th className="text-left px-3 py-2.5 font-semibold">P1</th>
              <th className="text-left px-3 py-2.5 font-semibold">P2</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-amber-50/40 align-top">
                <td className="px-3 py-3 font-mono text-sm text-zinc-900 whitespace-nowrap">{r.video_id || '—'}</td>
                <td className="px-3 py-3 text-sm text-zinc-700 whitespace-nowrap">{r.batch_date || ''}</td>
                <td className="px-3 py-3 text-sm text-zinc-900 font-medium whitespace-nowrap">{r.monte || ''}</td>
                <td className="px-3 py-3 text-sm text-zinc-700 whitespace-nowrap">{r.formato || '—'}</td>
                <td className="px-3 py-3 text-sm text-zinc-900">{r.tema || ''}</td>
                <td className="px-3 py-3 text-sm text-zinc-900 max-w-md" title={r.p1_copy}>
                  <span className="line-clamp-2">{r.p1_copy}</span>
                </td>
                <td className="px-3 py-3 text-sm text-zinc-900 max-w-md" title={r.p2_copy}>
                  <span className="line-clamp-2">{r.p2_copy}</span>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-zinc-500">Nenhuma copy encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-100"
        >
          ← Anterior
        </button>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={(page + 1) * PAGE_SIZE >= total || loading}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-100"
        >
          Próxima →
        </button>
      </div>
    </div>
  );
}
