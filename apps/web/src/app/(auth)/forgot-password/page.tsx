'use client';
import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/auth';
import { ApiError } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try { await forgotPassword(email); setDone(true); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Request failed'); }
    finally { setLoading(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="mt-1 text-sm text-slate-600">We&apos;ll send a reset link if the account exists.</p>
        {done ? (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">If an account exists for {email}, a reset link has been sent.</div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div><label className="mb-1 block text-sm font-medium">Email</label><input type="email" required className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={email} onChange={e=>setEmail(e.target.value)} /></div>
            <button disabled={loading} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">{loading ? 'Sending...' : 'Send reset link'}</button>
          </form>
        )}
        <p className="mt-4 text-sm"><Link href="/login" className="text-indigo-600 hover:underline">Back to sign in</Link></p>
      </div>
    </main>
  );
}
