import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Breadcrumbs from './Breadcrumbs';

describe('Breadcrumbs', () => {
  it('renders breadcrumb items', () => {
    render(
      <MemoryRouter>
        <Breadcrumbs
          items={[
            { label: 'Plant MES', path: '/' },
            { label: 'Recetas' },
            { label: 'Lista de Recetas' },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByText('Plant MES')).toBeInTheDocument();
    expect(screen.getByText('Lista de Recetas')).toBeInTheDocument();
  });

  it('marks the last item as current page', () => {
    render(
      <MemoryRouter>
        <Breadcrumbs items={[{ label: 'Dashboard' }]} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Dashboard')).toHaveAttribute('aria-current', 'page');
  });
});
