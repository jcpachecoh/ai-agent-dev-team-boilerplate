export type SedeTheme = 'light' | 'dark';
export type SedeSize = 'sm' | 'md' | 'xl';

export type SedeLocationStatus = 'active' | 'inactive';
export type SedeStatusFilter = 'all' | 'active' | 'inactive';

export type SedeMetricValueColor = 'default' | 'success' | 'muted' | 'primary';

export type SedeUserAvatarTone = 'teal' | 'coral' | 'indigo' | 'amber' | 'purple';

export interface SedeAssignedUser {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
  initials?: string;
  tone?: SedeUserAvatarTone;
}

export interface SedeAssignUserOption {
  id: string;
  label: string;
  hint?: string;
}

export interface SedeTableRowData {
  id: string;
  name: string;
  createdAt?: string;
  address?: string;
  city?: string;
  phone?: string;
  isActive: boolean;
  assignedUsers?: SedeAssignedUser[];
}
