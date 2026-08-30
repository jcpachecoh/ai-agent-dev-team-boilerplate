export interface CloudflareR2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
  publicDomain: string;
}

export function loadCloudflareR2Config(): CloudflareR2Config {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const endpoint = process.env.R2_ENDPOINT;
  const publicDomain = process.env.R2_PUBLIC_DOMAIN;

  const missing: string[] = [];
  if (!accountId) missing.push('R2_ACCOUNT_ID');
  if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID');
  if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
  if (!bucketName) missing.push('R2_BUCKET_NAME');
  if (!endpoint) missing.push('R2_ENDPOINT');
  if (!publicDomain) missing.push('R2_PUBLIC_DOMAIN');

  if (missing.length > 0) {
    throw new Error(
      `Cloudflare R2 configuration is incomplete. Missing env vars: ${missing.join(', ')}`,
    );
  }

  return {
    accountId: accountId!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    bucketName: bucketName!,
    endpoint: endpoint!,
    publicDomain: publicDomain!,
  };
}
