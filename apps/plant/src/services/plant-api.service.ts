const base = () => import.meta.env.VITE_PLANT_API_URL?.replace(/\/$/, '') ?? '';

export async function plantFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = base() ? `${base()}${path}` : path;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Plant API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}
