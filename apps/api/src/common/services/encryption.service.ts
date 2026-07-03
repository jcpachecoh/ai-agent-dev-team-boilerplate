import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor() {
    const rawKey = process.env.ENCRYPTION_KEY;
    if (!rawKey) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    const keyBuffer = Buffer.from(rawKey, 'hex');
    if (keyBuffer.length !== KEY_BYTES) {
      throw new Error(
        `ENCRYPTION_KEY must be ${KEY_BYTES * 2} hex characters (${KEY_BYTES} bytes)`,
      );
    }
    this.key = keyBuffer;
  }

  /**
   * Returns "iv:authTag:ciphertext" (base64-encoded parts separated by colons).
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_BYTES,
    });
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(
      ':',
    );
  }

  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format — expected iv:authTag:ciphertext');
    }
    const [ivB64, tagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_BYTES,
    });
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }

  /**
   * Returns last `keepLast` digits, the rest masked with '*'.
   * Used for accountNumber and taxId display.
   */
  mask(value: string, keepLast = 4): string {
    if (value.length <= keepLast) return value;
    return '*'.repeat(value.length - keepLast) + value.slice(-keepLast);
  }

  /**
   * Extracts the last `n` characters of a plain value for storage.
   */
  last(value: string, n = 4): string {
    return value.slice(-n);
  }
}
