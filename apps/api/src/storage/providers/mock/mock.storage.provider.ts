import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageProviderType } from '../../enums/storage.enums';
import type {
  StorageProvider,
  StorageProviderUploadOptions,
  StorageProviderUploadResult,
} from '../../interfaces/storage.interfaces';

/**
 * In-memory provider for unit/e2e tests. Never calls any external service.
 */
@Injectable()
export class MockStorageProvider implements StorageProvider {
  readonly providerType = StorageProviderType.LOCAL;
  readonly bucketName = 'mock-bucket';

  private readonly store = new Map<string, Buffer>();

  async upload(options: StorageProviderUploadOptions): Promise<StorageProviderUploadResult> {
    this.store.set(options.key, options.buffer);
    return { key: options.key, etag: 'mock-etag' };
  }

  async delete(key: string, _bucket: string): Promise<void> {
    this.store.delete(key);
  }

  async getPresignedUrl(key: string, _bucket: string, ttlSeconds: number): Promise<string> {
    return `https://mock.storage/${key}?ttl=${ttlSeconds}`;
  }

  async exists(key: string, _bucket: string): Promise<boolean> {
    return this.store.has(key);
  }

  async getObjectBuffer(key: string, _bucket: string): Promise<Buffer> {
    const buffer = this.store.get(key);
    if (!buffer) {
      throw new NotFoundException(`Mock storage object not found: ${key}`);
    }
    return Buffer.from(buffer);
  }

  /** Test helper — inspect what was stored */
  getStored(key: string): Buffer | undefined {
    return this.store.get(key);
  }

  clear(): void {
    this.store.clear();
  }
}
