import { BadRequestException } from '@nestjs/common';

export const SUPPORTED_ASSISTANT_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'] as const;
export type SupportedAssistantModel = (typeof SUPPORTED_ASSISTANT_MODELS)[number];

export function assertSupportedModel(model?: string) {
  if (model && !SUPPORTED_ASSISTANT_MODELS.includes(model as SupportedAssistantModel)) {
    throw new BadRequestException(`Unsupported model. Supported: ${SUPPORTED_ASSISTANT_MODELS.join(', ')}`);
  }
}

export function normalizeAllowedDomains(domains?: string[]): string[] | null {
  if (!domains) return null;
  const cleaned = domains
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
    .map((d) => d.replace(/^https?:\/\//, '').replace(/\/.*$/, ''));
  const valid = cleaned.filter((d) => /^[a-z0-9.-]+(?::\d+)?$/.test(d) && d.includes('.'));
  if (valid.length !== cleaned.length) throw new BadRequestException('Invalid allowedDomains entry');
  return Array.from(new Set(valid));
}
