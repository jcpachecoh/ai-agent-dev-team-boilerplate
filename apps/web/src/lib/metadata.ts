import type { Metadata } from 'next';

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
}

const SITE_URL = 'https://opssynk.com';

export function buildMetadata({
  title,
  description,
  path,
  ogImage = '/og-default.png',
}: PageMetadataInput): Metadata {
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'es_CO',
      url,
      siteName: 'OpsSync',
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      creator: '@opssynk',
      title,
      description,
      images: [ogImage],
    },
  };
}
