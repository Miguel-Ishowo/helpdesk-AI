'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RequireAuth } from '@/components/auth/require-auth';
import { useAuth } from '@/components/auth/auth-context';
import { ApiError } from '@/lib/api';
import { orgsApi, assistantsApi, type Organization, type Assistant } from '@/lib/org-assistants';

export default function AssistantsPage() {
  const { user, logout } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgId, setOrgId] = useState('');
  const [items, setItems] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', model: 'gpt-4o-mini' });

  async function load(org: string) {
    setLoading(true); setError(null);
    try { setItems(await assistantsApi.list(org)); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Failed to load assistants'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    (async () => {
      try {
        const mine = await orgsApi.listMine();
        setOrgs(mine);
        const first = mine[0]?.id || '';
        setOrgId(first);
        if (first) await load(first);
        else setLoading(false);
      } catch (e) { setError(e instanceof ApiError ? e.message : 'Failed to load organizations'); setLoading(false); }
    })();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setCreating(true); setError(null);
    try {
      await assistantsApi.create(orgId, { name: form.name, description: form.description || undefined, model: form.model });
      setForm({ name: '', description: '', model: 'gpt-4o-mini' });
      await load(orgId);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Create failed'); }
    finally { setCreating(false); }
  }

  async function onDelete(id: string) {
    if (!orgId || !confirm('Delete this assistant?')) return;
    try { await assistantsApi.remove(orgId, id); await load(orgId); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Delete failed'); }
  }

  return (
    <RequireAuth>
      <main className="min-h-screen p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-center justify-between rounded-2xl border bg-white p-6 shadow-sm">
            <div>
              <h1 className="text-2xl font-semibold">Assistants</h1>
              <p className="text-sm text-slate-600">Manage AI assistants for {user?.email}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard" className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">Dashboard</Link>
              <button onClick={() => logout()} className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">Sign out</button>
            </div>
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Organization</label>
                <select className="rounded-lg border px-3 py-2 text-sm" value={orgId} onChange={async e => { setOrgId(e.target.value); if (e.target.value) await load(e.target.value); }}>
                  {orgs.length === 0 && <option value="">No organization</option>}
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            </div>
            <form onSubmit={onCreate} className="mt-4 grid gap-3 sm:grid-cols-4">
              <input required placeholder="Assistant name" className="rounded-lg border px-3 py-2 text-sm sm:col-span-1" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
              <input placeholder="Description" className="rounded-lg border px-3 py-2 text-sm sm:col-span-1" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
              <select className="rounded-lg border px-3 py-2 text-sm" value={form.model} onChange={e=>setForm(f=>({...f,model:e.target.value}))}>
                {['gpt-4o-mini','gpt-4o','gpt-4.1-mini','gpt-4.1'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <button disabled={creating || !orgId} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">{creating ? 'Creating...' : 'Create assistant'}</button>
            </form>
          </div>

          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-6 py-4 font-medium">Your assistants</div>
            {loading ? <div className="p-6 text-sm text-slate-500">Loading...</div> :
             items.length === 0 ? <div className="p-6 text-sm text-slate-500">No assistants yet.</div> :
             <div className="divide-y">
               {items.map(a => (
                 <div key={a.id} className="flex items-center justify-between gap-4 px-6 py-4">
                   <div>
                     <div className="font-medium">{a.name}</div>
                     <div className="text-sm text-slate-600">{a.description || 'No description'} · {a.model} · {a.status}</div>
                   </div>
                   <div className="flex gap-2">
                     <Link href={`/dashboard/assistants/${a.id}?orgId=${orgId}`} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">Open</Link>
                     <button onClick={() => onDelete(a.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">Delete</button>
                   </div>
                 </div>
               ))}
             </div>}
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
