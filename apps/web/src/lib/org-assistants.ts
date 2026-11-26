import { apiFetch } from './api';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  myRole?: string;
}

export interface Assistant {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  systemPrompt: string | null;
  model: string;
  temperature: number;
  maxTokens: number | null;
  modelSettings: Record<string, unknown> | null;
  welcomeMessage: string | null;
  status: 'draft' | 'active' | 'inactive';
  publicId: string;
  allowedDomains: string[] | null;
  widgetSettings: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export type AssistantConfig = Pick<Assistant, 'id' | 'model' | 'temperature' | 'maxTokens' | 'modelSettings' | 'systemPrompt' | 'welcomeMessage' | 'status'>;

export const orgsApi = {
  listMine: () => apiFetch<Organization[]>('/organizations'),
  create: (input: { name: string; slug?: string }) => apiFetch<Organization>('/organizations', { method: 'POST', body: JSON.stringify(input) }),
};

export const assistantsApi = {
  list: (orgId: string) => apiFetch<Assistant[]>(`/organizations/${orgId}/assistants`),
  get: (orgId: string, id: string) => apiFetch<Assistant>(`/organizations/${orgId}/assistants/${id}`),
  create: (orgId: string, input: Partial<Assistant>) => apiFetch<Assistant>(`/organizations/${orgId}/assistants`, { method: 'POST', body: JSON.stringify(input) }),
  update: (orgId: string, id: string, input: Partial<Assistant>) => apiFetch<Assistant>(`/organizations/${orgId}/assistants/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (orgId: string, id: string) => apiFetch<{ success: boolean }>(`/organizations/${orgId}/assistants/${id}`, { method: 'DELETE' }),
  getConfig: (orgId: string, id: string) => apiFetch<AssistantConfig>(`/organizations/${orgId}/assistants/${id}/config`),
  updateConfig: (orgId: string, id: string, input: Partial<AssistantConfig>) => apiFetch<AssistantConfig>(`/organizations/${orgId}/assistants/${id}/config`, { method: 'PATCH', body: JSON.stringify(input) }),
};
