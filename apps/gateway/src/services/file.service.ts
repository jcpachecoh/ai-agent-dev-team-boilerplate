import { BaseService } from './base.service';
import { createChildLogger } from '../utils/logging';

const log = createChildLogger('file.service');

export interface UploadedFile {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
}

/**
 * FileService — stub for future file upload/storage integration.
 * Integrate with S3/GCS/R2 once the storage provider is selected.
 */
export class FileService extends BaseService {
  async upload(_tenantId: string, _filename: string, _buffer: Buffer): Promise<UploadedFile> {
    log.warn('FileService.upload is not yet implemented');
    throw new Error('File upload is not yet implemented');
  }

  async delete(_tenantId: string, _fileId: string): Promise<boolean> {
    log.warn('FileService.delete is not yet implemented');
    throw new Error('File delete is not yet implemented');
  }

  async getSignedUrl(_fileId: string): Promise<string> {
    log.warn('FileService.getSignedUrl is not yet implemented');
    throw new Error('FileService.getSignedUrl is not yet implemented');
  }
}
