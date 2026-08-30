import { Injectable } from '@nestjs/common';
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

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async getPresignedUrl(key: string, _bucket: string, ttlSeconds: number): Promise<string> {
    return `https://mock.storage/${key}?ttl=${ttlSeconds}`;
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  /** Test helper — inspect what was stored */
  getStored(key: string): Buffer | undefined {
    return this.store.get(key);
  }

  clear(): void {
    this.store.clear();
  }
}
