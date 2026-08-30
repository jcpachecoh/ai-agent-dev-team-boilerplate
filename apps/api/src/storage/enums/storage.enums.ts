export enum StorageProviderType {
  CLOUDFLARE_R2 = 'CLOUDFLARE_R2',
  LOCAL = 'LOCAL',
}

export enum StorageVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum StorageDomain {
  BRANDING = 'BRANDING',
  INVENTORY = 'INVENTORY',
  PRODUCTION = 'PRODUCTION',
  RECIPES = 'RECIPES',
  PAYROLL = 'PAYROLL',
  SUPPLIERS = 'SUPPLIERS',
  USERS = 'USERS',
}

export enum StorageObjectStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

export enum ImageProfile {
  LOGO = 'LOGO',
  AVATAR = 'AVATAR',
  PRODUCT = 'PRODUCT',
  RECIPE = 'RECIPE',
  INCIDENT = 'INCIDENT',
  BANNER = 'BANNER',
  NONE = 'NONE',
}
