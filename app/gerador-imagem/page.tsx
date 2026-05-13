import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/PageHeader';
import GeradorImagemForm from './GeradorImagemForm';
import { EMOCOES, ILUMINACOES, CENARIOS, ANGULOS } from '@/lib/templates';

export default async function GeradorImagemPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-full flex-1 bg-zinc-50">
      <PageHeader title="Gerador de prompt Nanobana" userEmail={user?.email} />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <GeradorImagemForm
          emocoes={EMOCOES.map(e => ({ key: e.key, label: e.label }))}
          iluminacoes={ILUMINACOES.map(i => ({ key: i.key, label: i.label }))}
          cenarios={CENARIOS.map(c => ({ key: c.key, label: c.label }))}
          angulos={ANGULOS.map(a => ({ key: a.key, label: a.label }))}
        />
      </main>
    </div>
  );
}
