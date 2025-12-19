const BASE = import.meta.env.VITE_API_URL as string;

const handleError = async (res: Response): Promise<never> => {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    throw new Error(json.message || text);
  } catch {
    throw new Error(text);
  }
};

export const api = {
  async post<T>(path: string, body: unknown, token?: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  async get<T>(path: string, token?: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) await handleError(res);
    return res.json();
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
    if (!res.ok) await handleError(res);
    return res.json();
  },

  async del<T>(path: string, token?: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) await handleError(res);
    return res.json();
  },
};

