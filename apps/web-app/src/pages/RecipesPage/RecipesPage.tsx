import { useLocation } from 'react-router-dom';

import { RecipeCategoriesScreen } from '@/screens/RecipeCategoriesScreen';
import { RecipesManagementScreen } from '@/screens/RecipesManagementScreen';

type RecipesView = 'list' | 'process' | 'history';

function resolveView(pathname: string): RecipesView {
  if (pathname.includes('/procesos')) return 'process';
  if (pathname.includes('/historial')) return 'history';
  return 'list';
}

export default function RecipesPage(): React.JSX.Element {
  const { pathname } = useLocation();

  if (pathname.includes('/categorias')) {
    return <RecipeCategoriesScreen />;
  }

  const view = resolveView(pathname);
  return <RecipesManagementScreen view={view} />;
}
