const BASE = import.meta.env.VITE_API_URL as string;

type ApiErrorBody = {
  success?: boolean;
  message?: string;
  error?: string;
};

async function parseError(res: Response): Promise<Error> {
  const text = await res.text();

  // Try JSON error first
  try {
    const data = JSON.parse(text) as ApiErrorBody;
    const msg = data?.message || data?.error || text || `HTTP ${res.status}`;
    return new Error(msg);
  } catch {
    // Non-JSON errors
    return new Error(text || `HTTP ${res.status}`);
  }
}

async function parseJsonOrNull<T>(res: Response): Promise<T> {
  if (res.status === 204) return null as T; // No Content
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

export const api = {
  async get<T>(path: string, token?: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) throw await parseError(res);
    return parseJsonOrNull<T>(res);
  },

  async post<T>(path: string, body: unknown, token?: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw await parseError(res);
    return parseJsonOrNull<T>(res);
  },

  async patch<T>(path: string, body: unknown, token?: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw await parseError(res);
    return parseJsonOrNull<T>(res);
  },

  async del<T>(path: string, token?: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) throw await parseError(res);
    return parseJsonOrNull<T>(res);
  },
};


