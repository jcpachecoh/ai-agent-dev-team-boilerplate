import { Routes, Route } from 'react-router-dom';

import OperationsHubPage from '@/pages/OperationsHubPage';
import RecipesPage from '@/pages/RecipesPage';
import NotFoundPage from '@/pages/NotFoundPage';

export default function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<OperationsHubPage />} />
      <Route path="/recetas" element={<RecipesPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
