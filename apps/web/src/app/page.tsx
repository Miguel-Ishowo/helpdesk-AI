'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-context';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && user) router.replace('/dashboard'); }, [loading, user, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-10 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold">HD</div>
        <h1 className="text-3xl font-bold tracking-tight">HelpDesk AI</h1>
        <p className="mt-3 text-slate-600">AI-powered customer support platform. Create assistants trained on your knowledge base.</p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link href="/register" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">Get started</Link>
          <Link href="/login" className="rounded-lg border px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
