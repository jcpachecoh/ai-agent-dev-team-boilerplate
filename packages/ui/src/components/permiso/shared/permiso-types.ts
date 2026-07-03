export type PermisoTheme = 'light' | 'dark';

export interface PermisoCatalogItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  module?: string | null;
}
