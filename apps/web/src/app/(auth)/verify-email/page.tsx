'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { verifyEmail } from '@/lib/auth';
import { ApiError } from '@/lib/api';

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading'|'ok'|'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Missing verification token.'); return; }
    verifyEmail(token).then(() => { setStatus('ok'); setMessage('Email verified successfully.'); })
      .catch((err) => { setStatus('error'); setMessage(err instanceof ApiError ? err.message : 'Verification failed.'); });
  }, [token]);

  const color = status === 'ok' ? 'green' : status === 'error' ? 'red' : 'slate';
  return <div className={`mt-6 rounded-lg border border-${color}-200 bg-${color}-50 px-3 py-2 text-sm text-${color}-700`}>{message}</div>;
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Verify email</h1>
        <Suspense fallback={<div className="mt-4 text-sm text-slate-500">Loading...</div>}>
          <VerifyEmailInner />
        </Suspense>
        <p className="mt-4 text-sm"><Link href="/login" className="text-indigo-600 hover:underline">Go to sign in</Link></p>
      </div>
    </main>
  );
}
