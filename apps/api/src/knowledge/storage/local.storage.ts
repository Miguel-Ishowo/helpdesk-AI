import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { StorageProvider, StoredFile } from './storage.interface';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly root: string;
  constructor(config: ConfigService) {
    this.root = config.get<string>('UPLOAD_DIR', path.resolve(process.cwd(), 'uploads'));
  }

  async save(file: { buffer: Buffer; originalName: string; mimeType: string }, keyPrefix: string): Promise<StoredFile> {
    const safeName = file.originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file';
    const key = `${keyPrefix}/${Date.now()}-${randomBytes(6).toString('hex')}-${safeName}`;
    const full = path.join(this.root, key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, file.buffer);
    return { storagePath: key.replace(/\\/g, '/'), size: file.buffer.length, mimeType: file.mimeType, originalName: file.originalName };
  }

  async read(storagePath: string): Promise<Buffer> {
    const full = path.join(this.root, storagePath);
    return fs.readFile(full);
  }

  async delete(storagePath: string): Promise<void> {
    const full = path.join(this.root, storagePath);
    try { await fs.unlink(full); } catch (e: unknown) { const err = e as { code?: string }; if (err.code !== 'ENOENT') throw e; }
  }
}
