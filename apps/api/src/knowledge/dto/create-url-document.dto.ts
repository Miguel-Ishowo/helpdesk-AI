import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateUrlDocumentDto {
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}
