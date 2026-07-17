import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { AnimatedSection } from './AnimatedSection';

describe('AnimatedSection', () => {
  it.each(['up', 'left', 'right', 'none'] as const)(
    'renderiza children con direction %s',
    (direction) => {
      render(<AnimatedSection direction={direction}>{`contenido-${direction}`}</AnimatedSection>);
      expect(screen.getByText(`contenido-${direction}`)).toBeInTheDocument();
    },
  );

  it('acepta delay y className', () => {
    render(
      <AnimatedSection delay={0.3} className="extra-class">
        con delay
      </AnimatedSection>,
    );
    expect(screen.getByText('con delay').className).toContain('extra-class');
  });
});
