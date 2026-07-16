import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RestOpsIQ',
  description: 'Restaurant Operations Intelligence Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
