'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { resetPassword } from '@/lib/auth';
import { ApiError } from '@/lib/api';

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try { await resetPassword(token, password); router.push('/login?reset=1'); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Reset failed'); }
    finally { setLoading(false); }
  }

  if (!token) return <div className="text-sm text-red-600">Missing reset token. Use the link from your email.</div>;

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div><label className="mb-1 block text-sm font-medium">New password</label><input type="password" required minLength={8} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={password} onChange={e=>setPassword(e.target.value)} /></div>
      <button disabled={loading} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">{loading ? 'Resetting...' : 'Reset password'}</button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Choose new password</h1>
        <Suspense fallback={<div className="mt-4 text-sm text-slate-500">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
        <p className="mt-4 text-sm"><Link href="/login" className="text-indigo-600 hover:underline">Back to sign in</Link></p>
      </div>
    </main>
  );
}
