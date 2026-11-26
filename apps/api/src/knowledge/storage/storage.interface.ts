export interface StoredFile {
  storagePath: string;
  size: number;
  mimeType: string;
  originalName: string;
}

export interface StorageProvider {
  save(file: { buffer: Buffer; originalName: string; mimeType: string }, keyPrefix: string): Promise<StoredFile>;
  read(storagePath: string): Promise<Buffer>;
  delete(storagePath: string): Promise<void>;
}
