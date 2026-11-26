'use client';
import Link from 'next/link';
import { RequireAuth } from '@/components/auth/require-auth';
import { useAuth } from '@/components/auth/auth-context';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  return (
    <RequireAuth>
      <main className="min-h-screen p-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between rounded-2xl border bg-white p-6 shadow-sm">
            <div>
              <h1 className="text-2xl font-semibold">Dashboard</h1>
              <p className="text-sm text-slate-600">Signed in as {user?.email}</p>
            </div>
            <button onClick={() => logout()} className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">Sign out</button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Link href="/dashboard/assistants" className="rounded-xl border bg-white p-5 shadow-sm hover:border-indigo-300"><div className="font-medium">Assistants</div><div className="mt-1 text-sm text-slate-600">Create and configure AI assistants</div><div className="mt-4 inline-flex rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700">Available</div></Link>
            {[['Knowledge Base','Upload documents and URLs','Coming in Phase 4'],['Conversations','Review chat history and feedback','Coming in Phase 5']].map(([t,d,s]) => (
              <div key={t} className="rounded-xl border bg-white p-5 shadow-sm"><div className="font-medium">{t}</div><div className="mt-1 text-sm text-slate-600">{d}</div><div className="mt-4 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{s}</div></div>
            ))}
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
