// Reference: javascript_auth_all_persistance blueprint
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient, setAuthToken, setRefreshToken, setActiveTenant, getActiveTenant } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type UserTenant = {
  id: string;
  tenantId: string;
  tenantRole: string;
  tenantName: string;
  tenantCountryCode: string;
  tenantStatus: string;
};

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  isTenantsLoading: boolean;
  error: Error | null;
  userTenants: UserTenant[];
  activeTenantId: string | null;
  setActiveTenantId: (tenantId: string) => void;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "email" | "password"> & { userType?: string };

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { 
    data: userTenants = [], 
    isLoading: isTenantsLoading 
  } = useQuery<UserTenant[]>({
    queryKey: ["/api/user/tenants"],
    enabled: !!user,
  });

  const [activeTenantId, setActiveTenantIdState] = useState<string | null>(getActiveTenant());

  // Auto-select first tenant if user has tenants but no active tenant selected
  useEffect(() => {
    if (userTenants.length > 0 && !activeTenantId) {
      const firstTenantId = userTenants[0].tenantId;
      setActiveTenant(firstTenantId);
      setActiveTenantIdState(firstTenantId);
    }
  }, [userTenants, activeTenantId]);

  const handleSetActiveTenant = (tenantId: string) => {
    setActiveTenant(tenantId);
    setActiveTenantIdState(tenantId);
    queryClient.invalidateQueries();
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData & { userType?: string }) => {
      const endpoint = credentials.userType === "agency" ? "/api/agency/login" : "/api/login";
      const { userType, ...creds } = credentials;
      const res = await apiRequest("POST", endpoint, creds);
      return await res.json();
    },
    onSuccess: (data: any) => {
      if (data.accessToken) {
        setAuthToken(data.accessToken);
      }
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
      }
      
      // Store user type for routing
      if (data.userType === "agency") {
        localStorage.setItem("user_type", "agency");
      } else {
        localStorage.setItem("user_type", "user");
      }
      
      const { accessToken, refreshToken: _, userType, agency, ...user } = data;
      queryClient.setQueryData(["/api/user"], user);
      
      toast({
        title: "Welcome back!",
        description: data.userType === "agency" ? `Welcome, ${user.name}` : "You've successfully logged in.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (data: any) => {
      if (data.accessToken) {
        setAuthToken(data.accessToken);
      }
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
      }
      const { accessToken, refreshToken: _, ...user } = data;
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Account created!",
        description: "Welcome to Royal VIP Tours.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout", {});
    },
    onSuccess: () => {
      setAuthToken(null);
      setRefreshToken(null);
      setActiveTenant(null);
      setActiveTenantIdState(null);
      queryClient.setQueryData(["/api/user"], null);
      queryClient.setQueryData(["/api/user/tenants"], []);
      toast({
        title: "Logged out",
        description: "You've been logged out successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isTenantsLoading,
        error,
        userTenants,
        activeTenantId,
        setActiveTenantId: handleSetActiveTenant,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
