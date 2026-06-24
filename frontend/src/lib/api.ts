import type { PaginatedResponse, Transaction, Book, Summary, MonthlySummary, CategorySummary, User } from "@/types";


let API_BASE = import.meta.env.VITE_API_URL || "";
if (API_BASE && !API_BASE.startsWith("http")) {
  API_BASE = `https://${API_BASE}`;
}
if (API_BASE.endsWith("/")) {
  API_BASE = API_BASE.slice(0, -1);
}


async function fetchApi(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include", // IMPORTANT: send httpOnly cookies
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    // Try refresh once
    const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshRes.status === 200) {
      // Retry original request
      const retry = await fetch(`${API_BASE}${path}`, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });
      if (!retry.ok) {
        const err = await retry.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${retry.status}`);
      }
      if (retry.status === 204) return null;
      return retry.json();
    }
    throw new Error("Session expired. Please login again.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: <T,>(path: string): Promise<T> => fetchApi(path),
  post: <T,>(path: string, body: unknown): Promise<T> => fetchApi(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T,>(path: string, body: unknown): Promise<T> => fetchApi(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => fetchApi(path, { method: "DELETE" }),
};

// Typed wrappers
export const authApi = {
  me: () => api.get<User>("/api/auth/me"),
  login: (email: string, password: string) => api.post<{ user: User }>("/api/auth/login", { email, password }),
  register: (name: string, email: string, password: string) => api.post<{ user: User }>("/api/auth/register", { name, email, password }),
  logout: () => api.post<null>("/api/auth/logout", {}),
};

export const bookApi = {
  list: () => api.get<Book[]>("/api/books"),
  create: (body: { name: string; emoji: string }) => api.post<Book>("/api/books", body),
  update: (id: string, body: { name: string; emoji: string }) => api.put<Book>(`/api/books/${id}`, body),
  delete: (id: string) => api.delete(`/api/books/${id}`),
};

export const transactionApi = {
  list: (params?: { page?: number; limit?: number; month?: string; type?: string; category?: string; bookId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.month) qs.set("month", params.month);
    if (params?.type) qs.set("type", params.type);
    if (params?.category) qs.set("category", params.category);
    if (params?.bookId) qs.set("bookId", params.bookId);
    return api.get<PaginatedResponse<Transaction>>(`/api/transactions?${qs.toString()}`);
  },
  create: (body: Omit<Transaction, "id" | "userId" | "createdAt">) => api.post<Transaction>("/api/transactions", body),
  update: (id: string, body: Partial<Omit<Transaction, "id" | "userId" | "createdAt">>) => api.put<Transaction>(`/api/transactions/${id}`, body),
  delete: (id: string) => api.delete(`/api/transactions/${id}`),
};

export const summaryApi = {
  get: (params?: { month?: string; bookId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.month) qs.set("month", params.month);
    if (params?.bookId) qs.set("bookId", params.bookId);
    return api.get<Summary>(`/api/summary?${qs.toString()}`);
  },
  monthly: (params?: { bookId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.bookId) qs.set("bookId", params.bookId);
    return api.get<MonthlySummary[]>(`/api/summary/monthly?${qs.toString()}`);
  },
  categories: (params?: { month?: string; bookId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.month) qs.set("month", params.month);
    if (params?.bookId) qs.set("bookId", params.bookId);
    return api.get<CategorySummary[]>(`/api/summary/categories?${qs.toString()}`);
  },
};
