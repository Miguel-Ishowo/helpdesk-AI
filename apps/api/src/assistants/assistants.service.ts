import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { randomBytes } from 'crypto';
import { Assistant, AssistantStatus } from '../database/entities';
import { CreateAssistantDto, UpdateAssistantDto, UpdateAssistantConfigDto } from './dto';
import { assertSupportedModel, normalizeAllowedDomains } from './assistant-config';

@Injectable()
export class AssistantsService {
  constructor(
    @InjectRepository(Assistant) private readonly assistants: Repository<Assistant>,
  ) {}

  private normalizeDomains(domains?: string[]): string[] | null {
    return normalizeAllowedDomains(domains);
  }

  private validateModel(model?: string) {
    assertSupportedModel(model);
  }

  private async generatePublicId(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const publicId = `asst_${randomBytes(12).toString('hex')}`;
      const exists = await this.assistants.findOne({ where: { publicId } });
      if (!exists) return publicId;
    }
    throw new BadRequestException('Failed to generate assistant public ID');
  }

  async create(orgId: string, dto: CreateAssistantDto) {
    this.validateModel(dto.model);
    const assistant = this.assistants.create({
      organizationId: orgId,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      systemPrompt: dto.systemPrompt?.trim() || null,
      model: dto.model || 'gpt-4o-mini',
      temperature: dto.temperature ?? 0.7,
      maxTokens: dto.maxTokens ?? null,
      modelSettings: dto.modelSettings ?? null,
      welcomeMessage: dto.welcomeMessage?.trim() || null,
      status: dto.status ?? AssistantStatus.DRAFT,
      publicId: await this.generatePublicId(),
      allowedDomains: this.normalizeDomains(dto.allowedDomains),
      widgetSettings: dto.widgetSettings ?? null,
    });
    return this.assistants.save(assistant);
  }

  async findAll(orgId: string) {
    return this.assistants.find({
      where: { organizationId: orgId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(orgId: string, id: string) {
    const assistant = await this.assistants.findOne({ where: { id, organizationId: orgId, deletedAt: IsNull() } });
    if (!assistant) throw new NotFoundException('Assistant not found');
    return assistant;
  }

  async update(orgId: string, id: string, dto: UpdateAssistantDto) {
    const assistant = await this.findOne(orgId, id);
    this.validateModel(dto.model);
    if (dto.name !== undefined) assistant.name = dto.name.trim();
    if (dto.description !== undefined) assistant.description = dto.description?.trim() || null;
    if (dto.systemPrompt !== undefined) assistant.systemPrompt = dto.systemPrompt?.trim() || null;
    if (dto.model !== undefined) assistant.model = dto.model;
    if (dto.temperature !== undefined) assistant.temperature = dto.temperature;
    if (dto.maxTokens !== undefined) assistant.maxTokens = dto.maxTokens;
    if (dto.modelSettings !== undefined) assistant.modelSettings = dto.modelSettings;
    if (dto.welcomeMessage !== undefined) assistant.welcomeMessage = dto.welcomeMessage?.trim() || null;
    if (dto.status !== undefined) assistant.status = dto.status;
    if (dto.allowedDomains !== undefined) assistant.allowedDomains = this.normalizeDomains(dto.allowedDomains);
    if (dto.widgetSettings !== undefined) assistant.widgetSettings = dto.widgetSettings;
    return this.assistants.save(assistant);
  }

  async getConfig(orgId: string, id: string) {
    const a = await this.findOne(orgId, id);
    return {
      id: a.id,
      model: a.model,
      temperature: a.temperature,
      maxTokens: a.maxTokens,
      modelSettings: a.modelSettings,
      systemPrompt: a.systemPrompt,
      welcomeMessage: a.welcomeMessage,
      status: a.status,
    };
  }

  async updateConfig(orgId: string, id: string, dto: UpdateAssistantConfigDto) {
    const assistant = await this.findOne(orgId, id);
    this.validateModel(dto.model);
    if (dto.model !== undefined) assistant.model = dto.model;
    if (dto.temperature !== undefined) assistant.temperature = dto.temperature;
    if (dto.maxTokens !== undefined) assistant.maxTokens = dto.maxTokens;
    if (dto.modelSettings !== undefined) assistant.modelSettings = dto.modelSettings;
    if (dto.systemPrompt !== undefined) assistant.systemPrompt = dto.systemPrompt?.trim() || null;
    if (dto.welcomeMessage !== undefined) assistant.welcomeMessage = dto.welcomeMessage?.trim() || null;
    if (dto.status !== undefined) assistant.status = dto.status;
    await this.assistants.save(assistant);
    return this.getConfig(orgId, id);
  }

  async remove(orgId: string, id: string) {
    const assistant = await this.findOne(orgId, id);
    await this.assistants.softRemove(assistant);
    return { success: true };
  }
}
