import { IsString, IsOptional, MaxLength, MinLength, IsNumber, Min, Max, IsInt, IsEnum, IsArray, IsObject } from 'class-validator';
import { AssistantStatus } from '../../database/entities';

export const SUPPORTED_ASSISTANT_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'] as const;

export class CreateAssistantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  systemPrompt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(16000)
  maxTokens?: number;

  @IsOptional()
  @IsObject()
  modelSettings?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  welcomeMessage?: string;

  @IsOptional()
  @IsEnum(AssistantStatus)
  status?: AssistantStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  allowedDomains?: string[];

  @IsOptional()
  @IsObject()
  widgetSettings?: Record<string, unknown>;
}

export class UpdateAssistantDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  systemPrompt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(16000)
  maxTokens?: number;

  @IsOptional()
  @IsObject()
  modelSettings?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  welcomeMessage?: string;

  @IsOptional()
  @IsEnum(AssistantStatus)
  status?: AssistantStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  allowedDomains?: string[];

  @IsOptional()
  @IsObject()
  widgetSettings?: Record<string, unknown>;
}
