'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { RequireAuth } from '@/components/auth/require-auth';
import { ApiError } from '@/lib/api';
import { assistantsApi, type Assistant } from '@/lib/org-assistants';

function AssistantDetail() {
  const params = useParams<{ assistantId: string }>();
  const search = useSearchParams();
  const orgId = search.get('orgId') || '';
  const id = params.assistantId;
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId || !id) return;
    assistantsApi.get(orgId, id).then(setAssistant).catch(e => setError(e instanceof ApiError ? e.message : 'Failed to load assistant'));
  }, [orgId, id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!assistant || !orgId) return;
    setSaving(true); setError(null); setMsg(null);
    try {
      const updated = await assistantsApi.update(orgId, id, {
        name: assistant.name,
        description: assistant.description || undefined,
        systemPrompt: assistant.systemPrompt || undefined,
        model: assistant.model,
        temperature: Number(assistant.temperature),
        maxTokens: assistant.maxTokens ?? undefined,
        welcomeMessage: assistant.welcomeMessage || undefined,
        status: assistant.status,
        allowedDomains: assistant.allowedDomains || [],
      });
      setAssistant(updated); setMsg('Saved');
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  if (!orgId) return <div className="p-8 text-sm text-red-600">Missing orgId query param.</div>;
  if (!assistant) return <div className="p-8 text-sm text-slate-500">{error || 'Loading...'}</div>;

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between rounded-2xl border bg-white p-6 shadow-sm">
          <div><h1 className="text-2xl font-semibold">{assistant.name}</h1><p className="text-sm text-slate-600">Public ID: {assistant.publicId}</p></div>
          <div className="flex gap-2">
            <Link href={`/dashboard/assistants/${assistant.id}/knowledge?orgId=${orgId}`} className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">Knowledge</Link>
            <Link href="/dashboard/assistants" className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">Back</Link>
          </div>
        </div>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {msg && <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</div>}
        <form onSubmit={save} className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-sm font-medium">Name</label><input className="w-full rounded-lg border px-3 py-2 text-sm" value={assistant.name} onChange={e=>setAssistant({...assistant,name:e.target.value})} /></div>
            <div><label className="mb-1 block text-sm font-medium">Status</label><select className="w-full rounded-lg border px-3 py-2 text-sm" value={assistant.status} onChange={e=>setAssistant({...assistant,status:e.target.value as Assistant['status']})}><option value="draft">draft</option><option value="active">active</option><option value="inactive">inactive</option></select></div>
          </div>
          <div><label className="mb-1 block text-sm font-medium">Description</label><input className="w-full rounded-lg border px-3 py-2 text-sm" value={assistant.description || ''} onChange={e=>setAssistant({...assistant,description:e.target.value})} /></div>
          <div><label className="mb-1 block text-sm font-medium">System prompt</label><textarea rows={5} className="w-full rounded-lg border px-3 py-2 text-sm" value={assistant.systemPrompt || ''} onChange={e=>setAssistant({...assistant,systemPrompt:e.target.value})} /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className="mb-1 block text-sm font-medium">Model</label><select className="w-full rounded-lg border px-3 py-2 text-sm" value={assistant.model} onChange={e=>setAssistant({...assistant,model:e.target.value})}>{['gpt-4o-mini','gpt-4o','gpt-4.1-mini','gpt-4.1'].map(m=><option key={m} value={m}>{m}</option>)}</select></div>
            <div><label className="mb-1 block text-sm font-medium">Temperature</label><input type="number" step="0.1" min="0" max="2" className="w-full rounded-lg border px-3 py-2 text-sm" value={assistant.temperature} onChange={e=>setAssistant({...assistant,temperature:Number(e.target.value)})} /></div>
            <div><label className="mb-1 block text-sm font-medium">Max tokens</label><input type="number" min="1" max="16000" className="w-full rounded-lg border px-3 py-2 text-sm" value={assistant.maxTokens ?? ''} onChange={e=>setAssistant({...assistant,maxTokens:e.target.value?Number(e.target.value):null})} /></div>
          </div>
          <div><label className="mb-1 block text-sm font-medium">Welcome message</label><input className="w-full rounded-lg border px-3 py-2 text-sm" value={assistant.welcomeMessage || ''} onChange={e=>setAssistant({...assistant,welcomeMessage:e.target.value})} /></div>
          <div><label className="mb-1 block text-sm font-medium">Allowed domains (comma separated)</label><input className="w-full rounded-lg border px-3 py-2 text-sm" value={(assistant.allowedDomains || []).join(', ')} onChange={e=>setAssistant({...assistant,allowedDomains:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} /></div>
          <button disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button>
        </form>
      </div>
    </main>
  );
}

export default function AssistantDetailPage() {
  return <RequireAuth><Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading...</div>}><AssistantDetail /></Suspense></RequireAuth>;
}