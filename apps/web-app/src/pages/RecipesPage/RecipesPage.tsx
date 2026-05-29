import { useNavigate } from 'react-router-dom';

import { RecipesManagementScreen } from '@/screens/RecipesManagementScreen';

export default function RecipesPage(): React.JSX.Element {
  const navigate = useNavigate();

  return <RecipesManagementScreen onLogout={() => navigate('/')} />;
}
