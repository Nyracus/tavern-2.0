const BASE = import.meta.env.VITE_API_URL as string;

if (!BASE) {
  console.error("VITE_API_URL is not set! API calls will fail.");
}

// Helper to build full URL
const buildUrl = (path: string): string => {
  if (!BASE) {
    throw new Error("API URL is not configured. Please set VITE_API_URL environment variable.");
  }
  // Ensure path starts with / and BASE doesn't end with /
  const cleanBase = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};

export const api = {
  async post<T>(path: string, body: unknown, token?: string): Promise<T> {
    const url = buildUrl(path);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  },

  async get<T>(path: string, token?: string): Promise<T> {
    const url = buildUrl(path);
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  },

  async patch<T>(path: string, body: unknown, token?: string): Promise<T> {
    const url = buildUrl(path);
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  },

  async del<T>(path: string, token?: string): Promise<T> {
    const url = buildUrl(path);
    const res = await fetch(url, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  },
};

