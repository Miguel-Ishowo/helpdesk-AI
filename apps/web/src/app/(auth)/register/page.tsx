'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-context';
import { ApiError } from '@/lib/api';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', organizationName: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      await register({ ...form, lastName: form.lastName || undefined, organizationName: form.organizationName || undefined });
      router.push('/onboarding');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="mt-1 text-sm text-slate-600">Start building your AI support assistant.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm font-medium">First name</label><input required className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.firstName} onChange={e=>set('firstName',e.target.value)} /></div>
            <div><label className="mb-1 block text-sm font-medium">Last name</label><input className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.lastName} onChange={e=>set('lastName',e.target.value)} /></div>
          </div>
          <div><label className="mb-1 block text-sm font-medium">Work email</label><input type="email" required className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.email} onChange={e=>set('email',e.target.value)} /></div>
          <div><label className="mb-1 block text-sm font-medium">Password</label><input type="password" required minLength={8} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.password} onChange={e=>set('password',e.target.value)} /><p className="mt-1 text-xs text-slate-500">Min 8 chars, upper/lower/number.</p></div>
          <div><label className="mb-1 block text-sm font-medium">Organization name <span className="text-slate-400">(optional)</span></label><input className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.organizationName} onChange={e=>set('organizationName',e.target.value)} /></div>
          <button disabled={loading} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">{loading ? 'Creating account...' : 'Create account'}</button>
        </form>
        <p className="mt-4 text-sm text-slate-600">Already have an account? <Link href="/login" className="text-indigo-600 hover:underline">Sign in</Link></p>
      </div>
    </main>
  );
}
