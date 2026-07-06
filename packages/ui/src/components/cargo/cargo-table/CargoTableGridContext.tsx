import { createContext, useContext, type ReactNode } from 'react';

const CargoTableGridTemplateContext = createContext<string | null>(null);

export function CargoTableGridTemplateProvider({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <CargoTableGridTemplateContext.Provider value={value}>
      {children}
    </CargoTableGridTemplateContext.Provider>
  );
}

export function useCargoTableGridTemplate(fallback: string): string {
  return useContext(CargoTableGridTemplateContext) ?? fallback;
}
