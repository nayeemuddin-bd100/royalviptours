import {
  Building2,
  Plane,
  Hotel,
  Users,
  MapPin,
  Calendar,
  FileText,
  Settings,
  LogOut,
  LayoutDashboard,
  Car,
  UserCircle,
  Landmark,
  Globe,
  ClipboardList,
  Database,
  Inbox,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";

// Admin navigation items
const adminItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Tenants", url: "/admin/tenants", icon: Globe },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Audit Logs", url: "/admin/audit", icon: FileText },
];

// Supplier navigation items (generic for all supplier types)
const supplierItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Catalog", url: "/supplier", icon: Building2 },
  { title: "RFQ Inbox", url: "/supplier/rfq-inbox", icon: FileText },
];

// Country Manager navigation items
const managerItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Country Catalog", url: "/country-manager/catalog", icon: Database },
];

// Transport Company navigation items
const transportItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Company", url: "/transport/profile", icon: Building2 },
  { title: "Fleet", url: "/transport/fleet", icon: Car },
  { title: "Products", url: "/transport/products", icon: Plane },
  { title: "RFQ Inbox", url: "/supplier/rfq-inbox", icon: FileText },
];

// Hotel navigation items
const hotelItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Hotel", url: "/hotel/profile", icon: Hotel },
  { title: "Room Types", url: "/hotel/rooms", icon: Building2 },
  { title: "Rates", url: "/hotel/rates", icon: FileText },
  { title: "RFQ Inbox", url: "/supplier/rfq-inbox", icon: ClipboardList },
];

// Tour Guide navigation items
const guideItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Profile", url: "/guide/profile", icon: UserCircle },
  { title: "Rates & Availability", url: "/guide/rates", icon: Calendar },
  { title: "RFQ Inbox", url: "/supplier/rfq-inbox", icon: FileText },
];

// Normal User navigation items
const normalUserItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
];

// Agency navigation items
const agencyItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Itineraries", url: "/itineraries", icon: Calendar },
  { title: "RFQs", url: "/rfqs", icon: FileText },
  { title: "Quotes", url: "/quotes", icon: ClipboardList },
  { title: "Account", url: "/agency/account", icon: Building2 },
];

interface UserTenant {
  id: string;
  tenantId: string;
  tenantRole: string;
  tenantName: string;
  tenantCountryCode: string;
  tenantStatus: string;
}

export function AppSidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  // Fetch user's tenant assignments to determine navigation
  const { data: userTenants, isLoading: isLoadingTenants } = useQuery<UserTenant[]>({
    queryKey: ['/api/user/tenants'],
    enabled: !!user && user.role !== 'admin',
  });

  // Determine navigation items based on user role
  const getNavigationItems = () => {
    if (!user) return [];
    
    if (user.role === "admin") {
      return adminItems;
    }

    // Normal users (not yet approved for any role) only see Dashboard
    if (user.role === "user") {
      return normalUserItems;
    }

    // Wait for tenant data to load before determining navigation for non-admin users
    // This prevents showing the wrong menu items during the loading phase
    if (isLoadingTenants) {
      return [];
    }

    // Check for specialized roles
    if (userTenants && userTenants.length > 0) {
      // Check if user has travel agent role
      const hasTravelAgentRole = userTenants.some((ut) => ut.tenantRole === 'travel_agent');
      if (hasTravelAgentRole) {
        return agencyItems;
      }
      
      // Check if user has country manager role
      const hasManagerRole = userTenants.some((ut) => ut.tenantRole === 'country_manager');
      if (hasManagerRole) {
        return managerItems;
      }
      
      // Check if user has supplier role (transport, hotel, guide, sight)
      const hasSupplierRole = userTenants.some((ut) => 
        ut.tenantRole && ['transport', 'hotel', 'guide', 'sight'].includes(ut.tenantRole)
      );
      if (hasSupplierRole) {
        return supplierItems;
      }
    }
    
    // Default to normal user navigation
    return normalUserItems;
  };

  const items = getNavigationItems();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Sidebar data-testid="app-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-sidebar-primary" />
          <span className="font-semibold text-sidebar-foreground">Royal VIP Tours</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoadingTenants && user?.role !== 'admin' ? (
                // Show loading skeleton while tenant data loads
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <SidebarMenuItem key={i}>
                      <div className="flex items-center gap-2 px-2 py-2">
                        <div className="h-4 w-4 bg-sidebar-accent rounded animate-pulse" />
                        <div className="h-4 flex-1 bg-sidebar-accent rounded animate-pulse" />
                      </div>
                    </SidebarMenuItem>
                  ))}
                </>
              ) : (
                items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatarUrl || undefined} />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || user?.email}
              </p>
              <p className="text-xs text-muted-foreground capitalize truncate">
                {user?.role || "User"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
