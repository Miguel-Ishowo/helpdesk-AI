export class ConfigService {
  get<T = unknown>(key: string, def?: T): T | undefined { void key; return def; }
}
