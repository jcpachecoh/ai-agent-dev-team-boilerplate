import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { StorageProviderType } from '../../enums/storage.enums';
import type {
  StorageProvider,
  StorageProviderUploadOptions,
  StorageProviderUploadResult,
} from '../../interfaces/storage.interfaces';
import { loadCloudflareR2Config } from './cloudflare-r2.config';

@Injectable()
export class CloudflareR2StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly logger = new Logger(CloudflareR2StorageProvider.name);

  readonly providerType = StorageProviderType.CLOUDFLARE_R2;
  readonly bucketName: string;

  constructor() {
    const config = loadCloudflareR2Config();
    this.bucketName = config.bucketName;

    this.client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(options: StorageProviderUploadOptions): Promise<StorageProviderUploadResult> {
    // R2 does NOT support per-object ACLs — the x-amz-acl header is silently ignored.
    // Public access is controlled at bucket level via Cloudflare dashboard (custom domain / r2.dev).
    // For PRIVATE assets, access is restricted by serving only presigned URLs from this API.
    // A separate private bucket is required if you need OS-level isolation for sensitive domains.
    const command = new PutObjectCommand({
      Bucket: options.bucket,
      Key: options.key,
      Body: options.buffer,
      ContentType: options.mimeType,
      Metadata: options.metadata,
    });

    const response = await this.client.send(command);
    this.logger.log(`Uploaded: ${options.key}`);

    return {
      key: options.key,
      etag: response.ETag?.replace(/"/g, ''),
    };
  }

  async delete(key: string, bucket: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    this.logger.log(`Deleted: ${key}`);
  }

  async getPresignedUrl(key: string, bucket: string, ttlSeconds: number): Promise<string> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: ttlSeconds });
  }

  async exists(key: string, bucket: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }
}
