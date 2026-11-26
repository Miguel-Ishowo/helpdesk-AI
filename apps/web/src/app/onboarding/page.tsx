'use client';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-context';

export default function OnboardingPage() {
  const { user } = useAuth();
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border bg-white p-10 shadow-sm">
        <p className="text-sm font-medium text-indigo-600">Onboarding</p>
        <h1 className="mt-2 text-3xl font-semibold">Welcome{user?.firstName ? `, ${user.firstName}` : ''}</h1>
        <p className="mt-3 text-slate-600">Your account is ready. Next steps: create an assistant, add knowledge sources, and embed the widget.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[['1','Create assistant','Set name, instructions and model.'],['2','Add knowledge','Upload docs or URLs for RAG.'],['3','Embed widget','Install script on your website.']].map(([n,t,d]) => (
            <div key={n} className="rounded-xl border p-4"><div className="text-xs font-semibold text-indigo-600">STEP {n}</div><div className="mt-1 font-medium">{t}</div><div className="mt-1 text-sm text-slate-600">{d}</div></div>
          ))}
        </div>
        <div className="mt-8 flex gap-3">
          <Link href="/dashboard" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">Go to dashboard</Link>
        </div>
      </div>
    </main>
  );
}
