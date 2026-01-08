// src/lib/api.ts
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export async function apiFetch<T>(
    path: string,
    opts?: {
        method?: HttpMethod;
        token?: string;
        body?: unknown;
    },
): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: opts?.method ?? 'GET',
        headers: {
            ...(opts?.token ? { Authorization: `Bearer ${opts.token}` } : {}),
            ...(opts?.body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: opts?.body ? JSON.stringify(opts.body) : undefined,
    });

    if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg =
            data?.message ??
            (res.status === 401 ? 'No autorizado.' : 'Error en la solicitud.');
        throw new Error(msg);
    }

    return (await res.json()) as T;
}