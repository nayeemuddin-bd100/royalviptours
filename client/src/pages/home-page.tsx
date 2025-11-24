import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Calendar, FileText, TrendingUp, Users, MapPin } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

interface UserTenant {
  id: string;
  tenantId: string;
  tenantRole: string;
  tenantName: string;
  tenantCountryCode: string;
  tenantStatus: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch user's tenant assignments to determine role
  const { data: userTenants = [], isLoading } = useQuery<UserTenant[]>({
    queryKey: ['/api/user/tenants'],
    enabled: !!user && user.role !== 'admin',
  });

  // Redirect users to appropriate dashboard based on their role
  useEffect(() => {
    if (!user) return;

    // If admin, stay on home page
    if (user.role === 'admin') {
      return;
    }

    // Wait for query to finish loading before redirecting
    if (isLoading) return;

    // Check if user has travel agent role
    const hasAgentRole = userTenants.some((ut) => ut.tenantRole === 'travel_agent');
    
    if (hasAgentRole) {
      setLocation('/agency');
      return;
    }

    // Check if user has supplier role (transport, hotel, guide, sight)
    const hasSupplierRole = userTenants.some((ut) => 
      ut.tenantRole && ['transport', 'hotel', 'guide', 'sight'].includes(ut.tenantRole)
    );
    
    if (hasSupplierRole) {
      setLocation('/supplier');
      return;
    }

    // Check if user has country manager role
    const hasManagerRole = userTenants.some((ut) => ut.tenantRole === 'country_manager');
    
    if (hasManagerRole) {
      setLocation('/country-manager/catalog');
      return;
    }

    // If no tenant roles found, redirect to user dashboard
    setLocation('/user-dashboard');
  }, [user, userTenants, setLocation, isLoading]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome back{user?.name ? `, ${user.name}` : ""}!
        </h1>
        <p className="text-sm text-muted-foreground">
          Here's an overview of your Royal VIP Tours activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Itineraries</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
            <p className="text-xs text-muted-foreground">No itineraries yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
            <p className="text-xs text-muted-foreground">No pending quotes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">0</div>
            <p className="text-xs text-muted-foreground">No suppliers yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">$0</div>
            <p className="text-xs text-muted-foreground">No activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Itineraries</CardTitle>
            <CardDescription>Your latest travel itineraries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">No itineraries yet</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Start building your first itinerary to request quotes from suppliers
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending RFQs</CardTitle>
            <CardDescription>Quote requests awaiting response</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">No pending requests</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Quote requests will appear here when you submit an itinerary
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for different roles */}
      {user?.role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/admin/tenants">
                <button
                  className="flex items-center gap-3 p-4 rounded-md border border-border hover-elevate active-elevate-2 text-left w-full"
                  data-testid="quick-action-tenants"
                >
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Manage Tenants</p>
                    <p className="text-xs text-muted-foreground">Add countries & regions</p>
                  </div>
                </button>
              </Link>
              <Link href="/admin/users">
                <button
                  className="flex items-center gap-3 p-4 rounded-md border border-border hover-elevate active-elevate-2 text-left w-full"
                  data-testid="quick-action-users"
                >
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Manage Users</p>
                    <p className="text-xs text-muted-foreground">Assign roles & permissions</p>
                  </div>
                </button>
              </Link>
              <Link href="/admin/audit">
                <button
                  className="flex items-center gap-3 p-4 rounded-md border border-border hover-elevate active-elevate-2 text-left w-full"
                  data-testid="quick-action-audit"
                >
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Audit Logs</p>
                    <p className="text-xs text-muted-foreground">View system activity</p>
                  </div>
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
