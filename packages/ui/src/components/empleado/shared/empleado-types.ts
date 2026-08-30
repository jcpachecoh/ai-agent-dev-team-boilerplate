export type EmpleadoTheme = 'light' | 'dark';
export type EmpleadoSize = 'sm' | 'md' | 'lg';

export type EmpleadoStatusFilterValue = 'all' | 'active' | 'inactive';

export type EmpleadoAvatarTone = 'teal' | 'cyan' | 'amber' | 'blue' | 'coral' | 'purple';

export interface EmpleadoTableRowData {
  id: string;
  name: string;
  email?: string;
  initials?: string;
  avatarTone?: EmpleadoAvatarTone;
  cedula?: string;
  position?: string;
  area?: string;
  contractType?: string;
  locationName?: string;
  locationCity?: string;
  hireDate?: string;
  isActive?: boolean;
}
