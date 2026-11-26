import { apiFetch } from './api';

export interface KnowledgeDocument {
  id: string;
  assistantId: string;
  name: string;
  sourceType: 'pdf' | 'txt' | 'markdown' | 'url';
  sourceUrl: string | null;
  storagePath: string | null;
  status: 'pending' | 'processing' | 'indexed' | 'failed';
  errorMessage: string | null;
  chunkCount: number;
  createdAt: string;
}

export const knowledgeApi = {
  list: (orgId: string, assistantId: string) => apiFetch<KnowledgeDocument[]>(`/organizations/${orgId}/assistants/${assistantId}/documents`),
  upload: async (orgId: string, assistantId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/organizations/${orgId}/assistants/${assistantId}/documents/upload`, {
      method: 'POST',
      body: form,
      credentials: 'include',
      headers: (await import('./api')).getAccessToken() ? { Authorization: `Bearer ${(await import('./api')).getAccessToken()}` } : undefined,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.message || `Upload failed (${res.status})`);
    return body as KnowledgeDocument;
  },
  addUrl: (orgId: string, assistantId: string, url: string, name?: string) => apiFetch<KnowledgeDocument>(`/organizations/${orgId}/assistants/${assistantId}/documents/url`, { method: 'POST', body: JSON.stringify({ url, name }) }),
  process: (orgId: string, assistantId: string, docId: string) => apiFetch<KnowledgeDocument>(`/organizations/${orgId}/assistants/${assistantId}/documents/${docId}/process`, { method: 'POST' }),
  index: (orgId: string, assistantId: string, docId: string) => apiFetch<KnowledgeDocument>(`/organizations/${orgId}/assistants/${assistantId}/documents/${docId}/index`, { method: 'POST' }),
  remove: (orgId: string, assistantId: string, docId: string) => apiFetch<{ success: boolean }>(`/organizations/${orgId}/assistants/${assistantId}/documents/${docId}`, { method: 'DELETE' }),
};
