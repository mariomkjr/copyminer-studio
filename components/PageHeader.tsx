import Link from 'next/link';
import SignOutButton from './SignOutButton';

export default function PageHeader({ title, userEmail }: { title: string; userEmail?: string | null }) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-base font-semibold text-zinc-900 hover:text-amber-700 transition">
            copyminer-studio
          </Link>
          <span className="text-zinc-300">›</span>
          <span className="text-base text-zinc-700">{title}</span>
        </div>
        <div className="flex items-center gap-4">
          {userEmail && <span className="text-sm text-zinc-600">{userEmail}</span>}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
