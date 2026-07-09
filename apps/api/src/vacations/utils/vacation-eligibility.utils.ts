import { EmployeeContractType } from '@prisma/client';

const VACATION_INELIGIBLE_CONTRACT_TYPES = new Set<EmployeeContractType>([
  EmployeeContractType.PRESTACION,
]);

export function isEmployeeEligibleForVacations(contractType: EmployeeContractType): boolean {
  return !VACATION_INELIGIBLE_CONTRACT_TYPES.has(contractType);
}
