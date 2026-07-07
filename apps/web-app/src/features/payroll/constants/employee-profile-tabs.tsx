import {
  Clock3,
  FileText,
  Landmark,
  Package,
  Receipt,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

export type PayrollEmployeeProfileTabId =
  | 'personal'
  | 'payments'
  | 'social-security'
  | 'attendance'
  | 'bank-accounts'
  // | 'taxes'
  | 'assets'
  | 'documents';

export interface PayrollEmployeeProfileTabDefinition {
  id: PayrollEmployeeProfileTabId;
  label: string;
  icon: ReactNode;
  placeholderTitle: string;
  placeholderDescription: string;
}

const iconProps = { size: 14, 'aria-hidden': true as const };

export const PAYROLL_EMPLOYEE_PROFILE_TABS: PayrollEmployeeProfileTabDefinition[] = [
  {
    id: 'personal',
    label: 'Datos personales y laborales',
    icon: <UserRound {...iconProps} />,
    placeholderTitle: 'Datos personales y laborales',
    placeholderDescription:
      'Identificación, contacto, foto, rol, contrato, salario y beneficiarios del colaborador.',
  },

  {
    id: 'social-security',
    label: 'Seg. social',
    icon: <ShieldCheck {...iconProps} />,
    placeholderTitle: 'Seguridad social',
    placeholderDescription:
      'Próximamente — afiliaciones a salud, pensión, ARL y caja de compensación.',
  },
  {
    id: 'attendance',
    label: 'Asistencia',
    icon: <Clock3 {...iconProps} />,
    placeholderTitle: 'Historial de asistencia',
    placeholderDescription:
      'Próximamente — registros de entrada/salida, ausencias, tardanzas y vacaciones.',
  },
  {
    id: 'bank-accounts',
    label: 'Bancos',
    icon: <Landmark {...iconProps} />,
    placeholderTitle: 'Cuentas bancarias',
    placeholderDescription:
      'Próximamente — cuentas para dispersión de nómina con datos enmascarados.',
  },
  // {
  //   id: 'taxes',
  //   label: 'Impuestos',
  //   icon: <Building2 {...iconProps} />,
  //   placeholderTitle: 'Información de impuestos',
  //   placeholderDescription: 'Próximamente — retención en la fuente y certificados tributarios.',
  // },
  {
    id: 'payments',
    label: 'Pagos',
    icon: <Receipt {...iconProps} />,
    placeholderTitle: 'Pagos y liquidaciones',
    placeholderDescription:
      'Próximamente — historial de pagos, salario base, novedades y comprobantes.',
  },
  {
    id: 'assets',
    label: 'Activos',
    icon: <Package {...iconProps} />,
    placeholderTitle: 'Activos del colaborador',
    placeholderDescription: 'Equipos y recursos asignados al colaborador.',
  },
  {
    id: 'documents',
    label: 'Documentos',
    icon: <FileText {...iconProps} />,
    placeholderTitle: 'Documentos del colaborador',
    placeholderDescription: 'Identificación, licencias, certificados y documentos de dependientes.',
  },
];

export const PAYROLL_EMPLOYEE_PROFILE_TAB_IDS = PAYROLL_EMPLOYEE_PROFILE_TABS.map((tab) => tab.id);

export function parsePayrollEmployeeProfileTab(value: string | null): PayrollEmployeeProfileTabId {
  if (value === 'employment') {
    return 'personal';
  }
  if (value && PAYROLL_EMPLOYEE_PROFILE_TAB_IDS.includes(value as PayrollEmployeeProfileTabId)) {
    return value as PayrollEmployeeProfileTabId;
  }
  return 'personal';
}

export function getPayrollEmployeeProfileTabDefinition(
  tabId: PayrollEmployeeProfileTabId,
): PayrollEmployeeProfileTabDefinition {
  return (
    PAYROLL_EMPLOYEE_PROFILE_TABS.find((tab) => tab.id === tabId) ??
    PAYROLL_EMPLOYEE_PROFILE_TABS[0]!
  );
}

export type PayrollEmployeeProfileTabIcon = LucideIcon;
