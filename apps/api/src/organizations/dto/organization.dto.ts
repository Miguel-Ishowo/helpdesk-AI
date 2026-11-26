import { IsString, MinLength, MaxLength, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { UserRole } from '../../database/entities';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug?: string;
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug?: string;
}

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateMemberRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

export class AcceptInvitationDto {
  @IsString()
  token: string;
}
