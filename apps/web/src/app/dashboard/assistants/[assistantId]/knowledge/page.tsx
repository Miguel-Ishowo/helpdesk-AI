'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { RequireAuth } from '@/components/auth/require-auth';
import { ApiError } from '@/lib/api';
import { knowledgeApi, type KnowledgeDocument } from '@/lib/knowledge';

function KnowledgePageInner() {
  const params = useParams<{ assistantId: string }>();
  const search = useSearchParams();
  const orgId = search.get('orgId') || '';
  const assistantId = params.assistantId;
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [url, setUrl] = useState('');

  async function load() {
    if (!orgId) return;
    try { setDocs(await knowledgeApi.list(orgId, assistantId)); }
    catch (e) { setError(e instanceof ApiError ? e.message : String(e)); }
  }
  useEffect(() => { load(); }, [orgId, assistantId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f || !orgId) return;
    setBusy('upload'); setError(null);
    try { await knowledgeApi.upload(orgId, assistantId, f); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Upload failed'); }
    finally { setBusy(null); e.target.value = ''; }
  }

  async function addUrl(e: React.FormEvent) {
    e.preventDefault(); if (!orgId || !url) return;
    setBusy('url'); setError(null);
    try { await knowledgeApi.addUrl(orgId, assistantId, url); setUrl(''); await load(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Add URL failed'); }
    finally { setBusy(null); }
  }

  async function action(id: string, kind: 'process'|'index'|'remove') {
    if (!orgId) return;
    setBusy(id+kind); setError(null);
    try {
      if (kind === 'process') await knowledgeApi.process(orgId, assistantId, id);
      if (kind === 'index') await knowledgeApi.index(orgId, assistantId, id);
      if (kind === 'remove') await knowledgeApi.remove(orgId, assistantId, id);
      await load();
    } catch (e) { setError(e instanceof ApiError ? e.message : String(e)); }
    finally { setBusy(null); }
  }

  if (!orgId) return <div className="p-8 text-sm text-red-600">Missing orgId query param.</div>;
  return (
    <main className="min-h-screen p-8"><div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between rounded-2xl border bg-white p-6 shadow-sm">
        <div><h1 className="text-2xl font-semibold">Knowledge Base</h1><p className="text-sm text-slate-600">Upload documents or URLs for RAG indexing.</p></div>
        <Link href={`/dashboard/assistants/${assistantId}?orgId=${orgId}`} className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">Back to assistant</Link>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm"><div className="font-medium">Upload file</div><p className="text-sm text-slate-600 mb-3">PDF, TXT, Markdown. Max 10MB.</p><input type="file" onChange={onUpload} disabled={busy==='upload'} className="text-sm" /></div>
        <form onSubmit={addUrl} className="rounded-2xl border bg-white p-6 shadow-sm"><div className="font-medium">Add URL</div><p className="text-sm text-slate-600 mb-3">We will fetch and extract page content.</p><div className="flex gap-2"><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." className="w-full rounded-lg border px-3 py-2 text-sm" /><button disabled={busy==='url'} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-60">Add</button></div></form>
      </div>
      <div className="rounded-2xl border bg-white shadow-sm"><div className="border-b px-6 py-4 font-medium">Documents</div>
        <div className="divide-y">{docs.length===0 ? <div className="p-6 text-sm text-slate-500">No documents yet.</div> : docs.map(d => (
          <div key={d.id} className="flex items-center justify-between gap-4 px-6 py-4">
            <div><div className="font-medium">{d.name}</div><div className="text-sm text-slate-600">{d.sourceType} · {d.status} · chunks: {d.chunkCount}{d.errorMessage ? ` · error: ${d.errorMessage}` : ''}</div></div>
            <div className="flex gap-2">
              <button onClick={()=>action(d.id,'process')} disabled={!!busy} className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50">Extract</button>
              <button onClick={()=>action(d.id,'index')} disabled={!!busy} className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50">Index</button>
              <button onClick={()=>action(d.id,'remove')} disabled={!!busy} className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50">Delete</button>
            </div>
          </div>
        ))}</div>
      </div>
    </div></main>
  );
}

export default function KnowledgePage() {
  return <RequireAuth><Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading...</div>}><KnowledgePageInner /></Suspense></RequireAuth>;
}