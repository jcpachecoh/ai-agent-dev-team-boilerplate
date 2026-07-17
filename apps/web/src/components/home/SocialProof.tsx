const CLIENT_NAMES = [
  'La Brasa Roja',
  'Sabores del Valle',
  'Cocina Andina',
  'El Fogón',
  'Mar y Tierra',
  'Buen Sazón',
];

export function SocialProof(): React.JSX.Element {
  return (
    <section className="border-b border-neutral-100 bg-white py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-neutral-600">
          Confiados por restaurantes líderes en Colombia
        </p>

        <div className="mt-8 flex gap-12 overflow-x-auto sm:justify-center sm:overflow-visible">
          {CLIENT_NAMES.map((name) => (
            <span
              key={name}
              className="shrink-0 whitespace-nowrap text-lg font-semibold text-neutral-900/40 opacity-40 transition-opacity duration-300 hover:opacity-100"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
