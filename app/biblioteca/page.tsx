import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/PageHeader';
import BibliotecaTabs from './BibliotecaTabs';

export default async function BibliotecaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: formatos }, { data: psychology }] = await Promise.all([
    supabase.from('formatos').select('*').order('display_order'),
    supabase.from('psychology_hooks').select('*').order('display_order'),
  ]);

  return (
    <div className="min-h-full flex-1 bg-zinc-50">
      <PageHeader title="Biblioteca" userEmail={user?.email} />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <BibliotecaTabs formatos={formatos || []} psychology={psychology || []} />
      </main>
    </div>
  );
}
