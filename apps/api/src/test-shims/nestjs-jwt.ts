export class JwtService {
  async signAsync(_payload: unknown, _opts?: unknown): Promise<string> { void _payload; void _opts; return 'jwt-token'; }
}
export type JwtSignOptions = Record<string, unknown>;
