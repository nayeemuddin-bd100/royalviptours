import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Token storage
let authToken: string | null = null;
let refreshToken: string | null = null;
let activeTenantId: string | null = null;
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("auth_token", token);
  } else {
    localStorage.removeItem("auth_token");
  }
}

export function getAuthToken(): string | null {
  if (!authToken && typeof window !== "undefined") {
    authToken = localStorage.getItem("auth_token");
  }
  return authToken;
}

export function setRefreshToken(token: string | null) {
  refreshToken = token;
  if (token) {
    localStorage.setItem("refresh_token", token);
  } else {
    localStorage.removeItem("refresh_token");
  }
}

export function getRefreshToken(): string | null {
  if (!refreshToken && typeof window !== "undefined") {
    refreshToken = localStorage.getItem("refresh_token");
  }
  return refreshToken;
}

async function attemptTokenRefresh(): Promise<boolean> {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    return false;
  }

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    });

    if (!res.ok) {
      setAuthToken(null);
      setRefreshToken(null);
      return false;
    }

    const data = await res.json();
    setAuthToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    return true;
  } catch {
    setAuthToken(null);
    setRefreshToken(null);
    return false;
  }
}

export function setActiveTenant(tenantId: string | null) {
  activeTenantId = tenantId;
  if (tenantId) {
    localStorage.setItem("active_tenant_id", tenantId);
  } else {
    localStorage.removeItem("active_tenant_id");
  }
}

export function getActiveTenant(): string | null {
  if (!activeTenantId && typeof window !== "undefined") {
    activeTenantId = localStorage.getItem("active_tenant_id");
  }
  return activeTenantId;
}

// Initialize tokens and tenant from localStorage on client side
if (typeof window !== "undefined") {
  authToken = localStorage.getItem("auth_token");
  refreshToken = localStorage.getItem("refresh_token");
  activeTenantId = localStorage.getItem("active_tenant_id");
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  let token = getAuthToken();
  const tenantId = getActiveTenant();
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  if (tenantId) {
    headers["X-Tenant-Id"] = tenantId;
  }

  let res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // If 401 and we have a refresh token, try to refresh
  if (res.status === 401 && getRefreshToken()) {
    // Use shared promise to prevent multiple concurrent refresh attempts
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = attemptTokenRefresh();
    }
    
    const refreshed = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;
    
    if (refreshed) {
      // Retry the original request with new token
      token = getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      res = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let token = getAuthToken();
    const tenantId = getActiveTenant();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    if (tenantId) {
      headers["X-Tenant-Id"] = tenantId;
    }

    let res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    // If 401 and we have a refresh token, try to refresh
    if (res.status === 401 && getRefreshToken()) {
      // Use shared promise to prevent multiple concurrent refresh attempts
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = attemptTokenRefresh();
      }
      
      const refreshed = await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;
      
      if (refreshed) {
        // Retry the original request with new token
        token = getAuthToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        
        res = await fetch(queryKey.join("/") as string, {
          headers,
          credentials: "include",
        });
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
