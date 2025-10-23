import { QueryClient, QueryFunction } from "@tanstack/react-query";

// JWT token storage
let authToken: string | null = null;
let activeTenantId: string | null = null;

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

// Initialize token and tenant from localStorage on client side
if (typeof window !== "undefined") {
  authToken = localStorage.getItem("auth_token");
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
  const token = getAuthToken();
  const tenantId = getActiveTenant();
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  if (tenantId) {
    headers["X-Tenant-Id"] = tenantId;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = getAuthToken();
    const tenantId = getActiveTenant();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    if (tenantId) {
      headers["X-Tenant-Id"] = tenantId;
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

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
