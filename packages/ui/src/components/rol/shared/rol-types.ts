export type RolTheme = 'light' | 'dark';
export type RolSize = 'sm' | 'md';

export interface RolTableRowData {
  id: string;
  code: string;
  name: string;
  userCount: number;
  permissionCount: number;
  isActive: boolean;
}
