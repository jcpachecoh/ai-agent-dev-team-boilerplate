import { useNavigate } from 'react-router-dom';

import { OperationsHubScreen } from '@/screens/OperationsHubScreen';

export default function OperationsHubPage(): React.JSX.Element {
  const navigate = useNavigate();

  return <OperationsHubScreen onOpenRecipes={() => navigate('/recetas')} />;
}
