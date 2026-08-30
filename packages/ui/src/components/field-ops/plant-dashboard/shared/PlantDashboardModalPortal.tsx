import { createPortal } from 'react-dom';
import type { JSX, ReactNode } from 'react';

export interface PlantDashboardModalPortalProps {
  open: boolean;
  children: ReactNode;
}

export function PlantDashboardModalPortal({
  open,
  children,
}: PlantDashboardModalPortalProps): JSX.Element | null {
  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
}

export default PlantDashboardModalPortal;
