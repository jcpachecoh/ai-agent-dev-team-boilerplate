import { useLocation } from 'react-router-dom';

import ModulePlaceholderPage from '@/pages/ModulePlaceholderPage';
import { getBreadcrumbsForPath } from '@/constants/navigation';

export default function UsersPage(): React.JSX.Element {
  const { pathname } = useLocation();
  const title = getBreadcrumbsForPath(pathname).at(-1)?.label ?? 'Usuarios';

  return <ModulePlaceholderPage title={title} />;
}
