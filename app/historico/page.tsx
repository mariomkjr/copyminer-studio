import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/PageHeader';
import HistoricoTable from './HistoricoTable';

export default async function HistoricoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Carrega formatos e MONTES pros filtros
  const [{ data: formatos }, { data: montes }] = await Promise.all([
    supabase.from('formatos').select('slug, name').order('display_order'),
    supabase.from('montes').select('name').eq('active', true).order('name'),
  ]);

  return (
    <div className="min-h-full flex-1 bg-zinc-50">
      <PageHeader title="Histórico de copies" userEmail={user?.email} />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <HistoricoTable formatos={formatos || []} montes={montes || []} />
      </main>
    </div>
  );
}
