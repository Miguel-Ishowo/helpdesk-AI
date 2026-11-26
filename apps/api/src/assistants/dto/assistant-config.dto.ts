import { IsOptional, IsString, MaxLength, IsNumber, Min, Max, IsInt, IsEnum, IsObject } from 'class-validator';
import { AssistantStatus } from '../../database/entities';

export class UpdateAssistantConfigDto {
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
  @MaxLength(10000)
  systemPrompt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  welcomeMessage?: string;

  @IsOptional()
  @IsEnum(AssistantStatus)
  status?: AssistantStatus;
}
