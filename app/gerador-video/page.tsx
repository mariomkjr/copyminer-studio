import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/PageHeader';
import GeradorVideoForm from './GeradorVideoForm';

export default async function GeradorVideoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-full flex-1 bg-zinc-50">
      <PageHeader title="Gerador prompt P1 + Extend" userEmail={user?.email} />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <GeradorVideoForm />
      </main>
    </div>
  );
}
